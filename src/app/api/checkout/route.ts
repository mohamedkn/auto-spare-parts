/**
 * Checkout API
 * ─────────────────────────────────────
 * POST /api/checkout — معالجة الدفع وإنشاء الطلب
 *
 * الخطوات (حسب القسم 7.1 و 7.2):
 * 1. قراءة الـ Idempotency-Key لمنع تكرار الطلب.
 * 2. قراءة السلة والتحقق الأولي من الـ Stock.
 * 3. بدء Transaction واحدة:
 *    أ. Optimistic Locking: خصم الـ stock بزيادة الـ version. لو فشل → Race Condition.
 *    ب. تقسيم الطلب لـ SubOrders حسب الـ Vendor.
 *    ج. حساب العمولة لكل متجر ونسخ commission_rate_snapshot.
 *    د. إنشاء الـ Order والـ SubOrders والـ OrderItems مرة واحدة.
 *    هـ. تفريغ السلة.
 *    و. إضافة سجل Payment (حالة pending).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { checkoutSchema } from "@/lib/validations/cart";
import { generateOrderNumber } from "@/lib/utils/order-number";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { createPaymobPayment } from "@/lib/payments/paymob";
import { DELIVERY_FEE_EGP } from "@/lib/delivery/pricing";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const customer = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { name: true, email: true },
    });
    if (!customer) return errorResponse("الحساب غير موجود", 401);

    // 1. استخراج الـ Idempotency Key
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 100) {
      return errorResponse("Idempotency-Key صالح مطلوب لإتمام الطلب", 400);
    }
    {
      // لو فيه طلب بنفس الـ key اتعمل قبل كده، رجعه على طول (يمنع double charging)
      const existingOrder = await prisma.order.findFirst({
        where: { idempotencyKey, userId: authUser.userId },
        include: { payments: true },
      });
      if (existingOrder) {
        return successResponse({ order: existingOrder }, 200);
      }
    }

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // 1.5. Prepare Shipping Address Snapshot
    let finalShippingAddress = data.shippingAddress;
    if (data.addressId) {
      const savedAddress = await prisma.userAddress.findUnique({
        where: { id: data.addressId },
      });
      if (!savedAddress || savedAddress.userId !== authUser.userId) {
        return errorResponse("العنوان المحفوظ غير موجود", 404);
      }
      finalShippingAddress = {
        fullName: savedAddress.fullName,
        phone: savedAddress.phone,
        addressLine1: savedAddress.streetAddress,
        addressLine2: savedAddress.buildingApartment || undefined,
        city: savedAddress.city,
        governorate: savedAddress.governorate,
        postalCode: undefined, // Or add to DB if needed
      };
    }

    // 2. قراءة السلة مع المنتجات
    const cart = await prisma.cart.findUnique({
      where: { userId: authUser.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                stockQuantity: true,
                price: true,
                version: true, // مهم للـ Optimistic Locking
                status: true,
                vendor: {
                  select: {
                    id: true,
                    commissionRate: true,
                    status: true,
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                stockQuantity: true,
                price: true,
                version: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return errorResponse("السلة فاضية", 400);
    }

    // تحقق أولي من المخزون قبل ما نبدأ Transaction
    for (const item of cart.items) {
      if (item.product.status !== "active" || item.product.vendor.status !== "approved") {
        return errorResponse(`المنتج "${item.product.name}" لم يعد متاحًا`, 400);
      }

      if (item.variant) {
        if (item.variant.stockQuantity < item.quantity) {
          return errorResponse(
            `الكمية المتاحة من "${item.product.name} - ${item.variant.name}" هي ${item.variant.stockQuantity} بس`,
            400
          );
        }
      } else {
        if (item.product.stockQuantity < item.quantity) {
          return errorResponse(
            `الكمية المتاحة من "${item.product.name}" هي ${item.product.stockQuantity} بس`,
            400
          );
        }
      }
    }

    // 3. المعالجة داخل Transaction واحدة
    const result = await prisma.$transaction(async (tx) => {
      // أ. خصم المخزون باستخدام Optimistic Locking
      for (const item of cart.items) {
        if (item.variantId && item.variant) {
          const updated = await tx.productVariant.updateMany({
            where: {
              id: item.variant.id,
              version: item.variant.version, // شرط الـ version
              stockQuantity: { gte: item.quantity }, // دبل تشيك إن الكمية تكفي
            },
            data: {
              stockQuantity: { decrement: item.quantity },
              version: { increment: 1 }, // زيادة الـ version
            },
          });

          if (updated.count === 0) {
            throw new Error(`RACE_CONDITION:${item.product.name}-${item.variant.name}`);
          }
        } else {
          const updated = await tx.product.updateMany({
            where: {
              id: item.product.id,
              version: item.product.version, // شرط الـ version
              stockQuantity: { gte: item.quantity }, // دبل تشيك إن الكمية تكفي
            },
            data: {
              stockQuantity: { decrement: item.quantity },
              version: { increment: 1 }, // زيادة الـ version
            },
          });

          if (updated.count === 0) {
            throw new Error(`RACE_CONDITION:${item.product.name}`);
          }
        }
      }

      // ب. تجميع البيانات وحساب الإجماليات وتقسيمها حسب الـ Vendor
      type VendorSubOrder = {
        vendorId: string;
        commissionRate: Prisma.Decimal;
        subtotal: number;
        items: Array<{
          productId: string;
          variantId?: string | null;
          quantity: number;
          unitPrice: Prisma.Decimal;
          totalPrice: Prisma.Decimal;
        }>;
      };

      const vendorMap = new Map<string, VendorSubOrder>();
      let orderTotalAmount = 0;

      for (const item of cart.items) {
        const vId = item.product.vendor.id;
        const commRate = item.product.vendor.commissionRate;
        const unitPrice = Number(item.variant?.price ?? item.product.price);
        const qty = item.quantity;
        const itemTotal = unitPrice * qty;

        orderTotalAmount += itemTotal;

        if (!vendorMap.has(vId)) {
          vendorMap.set(vId, {
            vendorId: vId,
            commissionRate: commRate,
            subtotal: 0,
            items: [],
          });
        }

        const vData = vendorMap.get(vId)!;
        vData.subtotal += itemTotal;
        vData.items.push({
          productId: item.product.id,
          variantId: item.variantId,
          quantity: qty,
          unitPrice: new Prisma.Decimal(unitPrice),
          totalPrice: new Prisma.Decimal(itemTotal),
        });
      }

      // A separate delivery is created for every vendor sub-order.
      orderTotalAmount += vendorMap.size * DELIVERY_FEE_EGP;

      // ج & د. إنشاء Order مع SubOrders و OrderItems
      const order = await tx.order.create({
        data: {
          userId: authUser.userId,
          orderNumber: generateOrderNumber(),
          totalAmount: new Prisma.Decimal(orderTotalAmount),
          shippingAddress: finalShippingAddress as Prisma.InputJsonValue,
          idempotencyKey,
          // تحديد حالة الدفع المبدئية بناءً على الطريقة
          paymentStatus:
            data.paymentMethod === "instapay"
              ? "pending_verification"
              : "pending",
          
          subOrders: {
            create: Array.from(vendorMap.values()).map((v) => {
              const commRateNum = Number(v.commissionRate);
              // حساب العمولة (مثال: 10% من الـ subtotal)
              const commAmount = (v.subtotal * commRateNum) / 100;
              const payoutAmount = v.subtotal - commAmount;

              return {
                vendorId: v.vendorId,
                subtotal: new Prisma.Decimal(v.subtotal),
                commissionRateSnapshot: v.commissionRate,
                commissionAmount: new Prisma.Decimal(commAmount),
                vendorPayoutAmount: new Prisma.Decimal(payoutAmount),
                items: {
                  create: v.items,
                },
              };
            }),
          },

          payments: {
            create: {
              provider: data.paymentMethod === "paymob" ? "paymob" : data.paymentMethod,
              amount: new Prisma.Decimal(orderTotalAmount),
              status:
                data.paymentMethod === "instapay"
                  ? "pending_verification"
                  : "pending",
            },
          },
        },
        include: {
          subOrders: {
            include: {
              items: true,
            },
          },
          payments: true,
        },
      });

      // هـ. تفريغ السلة باستخدام update عشان نحتفظ بالسلة نفسها كـ record
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { order, vendorMap };
    });

    // Send Push Notifications to Vendors
    if (data.paymentMethod === "cash_on_delivery") {
    try {
      const { sendPushNotification } = await import("@/lib/expoPush");
      const vendorIds = Array.from(result.vendorMap.keys());
      const vendors = await prisma.user.findMany({
        where: { vendorProfile: { id: { in: vendorIds } } },
        select: { id: true, expoPushToken: true, vendorProfile: { select: { id: true } } }
      });

      for (const user of vendors) {
        if (user.vendorProfile) {
          const vData = result.vendorMap.get(user.vendorProfile.id);
          const subtotalStr = vData ? vData.subtotal.toString() : "";
          
          // Save notification in database
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "طلب جديد! 📦",
              message: `لديك طلب جديد بقيمة ${subtotalStr} ج.م. يرجى مراجعته.`,
              type: "ORDER_RECEIVED"
            }
          });

          // Send push notification
          if (user.expoPushToken) {
            await sendPushNotification(
              user.expoPushToken,
              "طلب جديد! 📦",
              `لديك طلب جديد بقيمة ${subtotalStr} ج.م. يرجى مراجعته.`
            );
          }
        }
      }
    } catch (pushErr) {
      console.error("Failed to send push notifications:", pushErr);
    }
    }

    // Generate Paymob Payment URL if selected
    let paymentUrl = null;
    if (data.paymentMethod === "paymob") {
      try {
        paymentUrl = await createPaymobPayment(
          result.order.orderNumber,
          Number(result.order.totalAmount),
          {
            first_name: customer.name.split(" ")[0] || "Customer",
            last_name: customer.name.split(" ").slice(1).join(" ") || "Customer",
            email: customer.email,
            phone_number: finalShippingAddress?.phone || "01000000000",
          }
        );
      } catch (err) {
        console.error("Failed to generate Paymob URL:", err);
        try {
          await prisma.$transaction(async (tx) => {
            for (const item of cart.items) {
              if (item.variantId) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stockQuantity: { increment: item.quantity }, version: { increment: 1 } },
                });
              } else {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stockQuantity: { increment: item.quantity }, version: { increment: 1 } },
                });
              }
            }

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            await tx.cartItem.createMany({
              data: cart.items.map((item) => ({
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              })),
            });
            await tx.subOrder.updateMany({
              where: { orderId: result.order.id },
              data: { status: "cancelled" },
            });
            await tx.payment.updateMany({
              where: { orderId: result.order.id, provider: "paymob" },
              data: { status: "failed" },
            });
            await tx.order.update({
              where: { id: result.order.id },
              data: { paymentStatus: "failed" },
            });
          });
        } catch (compensationError) {
          console.error("Failed to compensate Paymob checkout", compensationError);
        }
        return errorResponse("تعذر بدء عملية الدفع. تمت إعادة المنتجات إلى سلتك.", 502);
      }
    }

    return successResponse({ order: result.order, paymentUrl }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RACE_CONDITION:")) {
      const productName = error.message.split(":")[1];
      return errorResponse(
        `نعتذر، في حد تاني لسه شاري "${productName}" والكمية خلصت أو اتغيرت. أرجوك راجع سلتك وحاول تاني.`,
        409 // Conflict
      );
    }
    
    // Prisma Unique Constraint (عشان الـ idempotencyKey لو حصل race condition في الـ Request نفسه)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return errorResponse("الطلب ده قيد التنفيذ أو تم بالفعل.", 409);
    }

    return handleApiError(error);
  }
}
