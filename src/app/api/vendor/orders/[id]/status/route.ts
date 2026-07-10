/**
 * Vendor Single Order API
 * ─────────────────────────────────────
 * PATCH /api/vendor/orders/:id/status — تحديث حالة الطلب الفرعي
 * 
 * التدفق:
 * 1. pending → preparing (قبول الطلب)
 * 2. preparing → shipped (جاهز للشحن — يُنشئ DeliveryJob)
 * 3. pending/preparing → cancelled (رفض — يحوّل المنتج لـ out_of_stock + يبحث عن تاجر بديل)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { updateSubOrderStatusSchema } from "@/lib/validations/order";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { randomInt } from "node:crypto";
import {
  DELIVERY_FEE_EGP,
  DELIVERY_PLATFORM_COMMISSION_EGP,
  DRIVER_EARNING_EGP,
} from "@/lib/delivery/pricing";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vendor/orders/[id]/status">
) {
  try {
    const authUser = await requireRole(request, "vendor");
    const { id } = await ctx.params;

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true, address: true, latitude: true, longitude: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    const body = await request.json();
    const data = updateSubOrderStatusSchema.parse(body);

    // تأكد إن الطلب الفرعي ده يخص متجر الـ Vendor
    const subOrder = await prisma.subOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, oemNumber: true, partNumber: true, vendorId: true }
            }
          }
        },
        order: {
          select: { shippingAddress: true, userId: true, payments: true, id: true }
        },
        vendor: {
          select: { id: true, address: true, latitude: true, longitude: true }
        }
      },
    });

    if (!subOrder) {
      return errorResponse("الطلب مش موجود", 404);
    }

    if (subOrder.vendorId !== vendor.id) {
      return errorResponse("الطلب ده لا يتبع متجرك", 403);
    }

    // ═══════════════════════════════════════════════════════════════
    // حالة 1: قبول الطلب (pending → preparing)
    // ═══════════════════════════════════════════════════════════════
    if (data.status === "preparing") {
      // قبول الطلب عملية idempotent: قد تصل الضغطة بعد أن يكون تحديث آخر
      // (أو نافذة التنبيه القديمة) قد نقل الطلب بالفعل إلى التجهيز.
      if (subOrder.status === "preparing") {
        return successResponse({
          message: "الطلب مقبول بالفعل وجاري تجهيزه",
          subOrder,
        });
      }

      if (subOrder.status !== "pending" && subOrder.status !== "confirmed") {
        return errorResponse("لا يمكن قبول طلب ليس في حالة انتظار", 400);
      }

      const payment = subOrder.order.payments[0];
      const isCashOnDelivery = payment?.provider === "cash_on_delivery" || payment?.provider === "cod";
      if (!isCashOnDelivery && payment?.status !== "succeeded") {
        return errorResponse("لا يمكن تجهيز الطلب قبل تأكيد الدفع", 409);
      }

      const updated = await prisma.subOrder.update({
        where: { id },
        data: { status: "preparing" },
      });

      return successResponse({
        message: "تم قبول الطلب وبدأ التجهيز",
        subOrder: updated,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // حالة 2: جاهز للشحن (preparing → processing) — يُنشئ DeliveryJob
    // ═══════════════════════════════════════════════════════════════
    if (data.status === "processing") {
      if (subOrder.status !== "preparing" && subOrder.status !== "processing") {
        return errorResponse("لا يمكن شحن طلب لم يبدأ تجهيزه بعد", 400);
      }

      const updatedSubOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.subOrder.update({
          where: { id },
          data: { status: "processing" },
        });

        // التأكد من عدم وجود DeliveryJob سابق
        const existingJob = await tx.deliveryJob.findUnique({
          where: { subOrderId: id },
        });

        if (!existingJob) {
          const pickupAddress = subOrder.vendor.address || "عنوان المتجر غير محدد";
          const shippingAddr = subOrder.order.shippingAddress as any;
          const dropoffAddress = [
            shippingAddr?.addressLine1,
            shippingAddr?.city,
            shippingAddr?.governorate,
          ].filter(Boolean).join("، ") || "عنوان العميل غير محدد";

          // لا نستخدم إحداثيات افتراضية؛ لأنها تجعل الطلب يبدو بعيدًا عن
          // المندوب وتؤدي إلى إخفائه من الرحلات القريبة بشكل خاطئ.
          const pickupLat = subOrder.vendor.latitude ?? null;
          const pickupLng = subOrder.vendor.longitude ?? null;
          const dropoffLat = shippingAddr?.latitude ?? null;
          const dropoffLng = shippingAddr?.longitude ?? null;

          const deliveryFee = DELIVERY_FEE_EGP;
          const payment = subOrder.order.payments?.[0] as any;
          const isCod = payment?.provider === "cash_on_delivery" || payment?.provider === "cod";
          const codAmountToCollect = isCod ? Number(subOrder.subtotal) + deliveryFee : 0;

          await tx.deliveryJob.create({
            data: {
              subOrderId: id,
              status: "broadcasted",
              pickupAddress,
              pickupLat,
              pickupLng,
              dropoffAddress,
              dropoffLat,
              dropoffLng,
              deliveryFee,
              driverEarning: DRIVER_EARNING_EGP,
              platformCommissionAmount: DELIVERY_PLATFORM_COMMISSION_EGP,
              isCod,
              codAmountToCollect,
              pickupOtp: randomInt(1000, 10000).toString(),
              deliveryOtp: randomInt(1000, 10000).toString(),
            }
          });
        }

        return updated;
      });

      return successResponse({
        message: "تم تجهيز الطلب وجاري البحث عن مندوب توصيل",
        subOrder: updatedSubOrder,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // حالة 3: رفض الطلب (pending/preparing → cancelled)
    // المنتج → out_of_stock + بحث عن تاجر بديل
    // ═══════════════════════════════════════════════════════════════
    if (data.status === "cancelled") {
      if (subOrder.status !== "pending" && subOrder.status !== "preparing") {
        return errorResponse("لا يمكن رفض طلب تم شحنه بالفعل", 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. إلغاء الطلب الفرعي
        await tx.subOrder.update({
          where: { id },
          data: { status: "cancelled" },
        });

        // 2. إرجاع المخزون للمنتجات بدون تغيير حالتها
        for (const item of subOrder.items) {
          // إرجاع المخزون المحجوز
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
        return { alternativeFound: false };
      });

      return successResponse({
        message: result.alternativeFound
          ? "تم رفض الطلب وتحويله لتاجر بديل"
          : "تم رفض الطلب وإلغاء الطلب الفرعي",
        alternativeFound: result.alternativeFound,
      });
    }

    return errorResponse("انتقال حالة الطلب غير مسموح", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
