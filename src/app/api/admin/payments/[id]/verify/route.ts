/**
 * Admin Payments API
 * ─────────────────────────────────────
 * PATCH /api/admin/payments/:id/verify — مراجعة وتأكيد/رفض الدفع اليدوي (InstaPay)
 *
 * القسم 10.2: تحويل الطلب لـ paid والـ sub_orders لـ confirmed لو تم القبول.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { verifyPaymentSchema } from "@/lib/validations/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { sendOrderConfirmationEmail } from "@/lib/services/email";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/payments/[id]/verify">
) {
  try {
    // 🔒 Authorization: Admin only
    await requireRole(request, "admin");
    const { id } = await ctx.params;

    const body = await request.json();
    const data = verifyPaymentSchema.parse(body);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { 
        order: {
          include: {
            user: { select: { email: true } },
            subOrders: {
              select: {
                id: true,
                subtotal: true,
                items: { select: { productId: true, variantId: true, quantity: true } },
                vendor: { select: { owner: { select: { id: true, expoPushToken: true } } } },
              },
            },
          }
        } 
      },
    });

    if (!payment) {
      return errorResponse("سجل الدفع غير موجود", 404);
    }

    if (payment.status !== "pending_verification") {
      return errorResponse(
        `العملية دي مش مستنية مراجعة، حالتها الحالية: ${payment.status}`,
        400
      );
    }

    const isApproved = data.action === "approve";
    const newPaymentStatus = isApproved ? "succeeded" : "failed";
    const newOrderStatus = isApproved ? "paid" : "failed";

    await prisma.$transaction(async (tx) => {
      // 1. تحديث حالة الدفع
      await tx.payment.update({
        where: { id },
        data: {
          status: newPaymentStatus,
          paidAt: isApproved ? new Date() : null,
          // note: data.notes could be saved if we add a 'notes' column to payments table
        },
      });

      // 2. تحديث حالة الطلب الأب
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: newOrderStatus },
      });

      // 3. لو اتقبل، حدّث كل الطلبات الفرعية لتأكيد الطلب
      if (isApproved) {
        await tx.subOrder.updateMany({
          where: { orderId: payment.orderId, status: "pending" },
          data: { status: "confirmed" },
        });
        await tx.notification.createMany({
          data: payment.order.subOrders.map((subOrder) => ({
            userId: subOrder.vendor.owner.id,
            title: "طلب جديد! 📦",
            message: `لديك طلب مدفوع جديد بقيمة ${Number(subOrder.subtotal).toLocaleString("ar-EG")} ج.م. يرجى مراجعته.`,
            type: "ORDER_RECEIVED",
          })),
        });
      } else {
        await tx.subOrder.updateMany({
          where: { orderId: payment.orderId, status: { in: ["pending", "confirmed"] } },
          data: { status: "cancelled" },
        });
        for (const subOrder of payment.order.subOrders) {
          for (const item of subOrder.items) {
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
        }
      }
    });

    if (isApproved && payment.order.user?.email) {
      sendOrderConfirmationEmail(
        payment.order.user.email,
        payment.order.orderNumber,
        Number(payment.amount)
      );
    }
    if (isApproved) {
      const { sendPushNotification } = await import("@/lib/expoPush");
      for (const subOrder of payment.order.subOrders) {
        if (!subOrder.vendor.owner.expoPushToken) continue;
        void sendPushNotification(
          subOrder.vendor.owner.expoPushToken,
          "طلب جديد! 📦",
          `لديك طلب مدفوع جديد بقيمة ${Number(subOrder.subtotal).toLocaleString("ar-EG")} ج.م. يرجى مراجعته.`,
        );
      }
    }

    return successResponse({
      message: isApproved ? "تم تأكيد الدفع بنجاح" : "تم رفض الدفع",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
