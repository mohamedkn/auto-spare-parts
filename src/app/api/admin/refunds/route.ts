import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { createRefundSchema } from "@/lib/validations/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "admin");

    const body = await request.json();
    const data = createRefundSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch OrderItem and Payment to verify them
      const orderItem = await tx.orderItem.findUnique({
        where: { id: data.orderItemId },
        include: {
          subOrder: {
            include: { payout: true },
          },
        },
      });

      if (!orderItem) {
        throw new Error("عنصر الطلب غير موجود");
      }

      const payment = await tx.payment.findUnique({
        where: { id: data.paymentId },
      });

      if (!payment) {
        throw new Error("عملية الدفع غير موجودة");
      }

      if (payment.status !== "succeeded") {
        throw new Error("لا يمكن رد مبلغ من عملية دفع غير ناجحة");
      }

      if (payment.orderId !== orderItem.subOrder.orderId) {
        throw new Error("عملية الدفع لا تخص هذا الطلب");
      }

      // 2. Check if a Payout already exists for this sub_order
      if (orderItem.subOrder.payout) {
        throw new Error(
          "لازم تتحول لـ dispute، تم تحويل مستحقات هذا الطلب للبائع مسبقاً."
        );
      }

      const previousRefunds = await tx.refund.aggregate({
        where: {
          orderItemId: data.orderItemId,
          status: { in: ["pending", "approved", "processed"] },
        },
        _sum: { amount: true },
      });
      const remainingRefundable = Number(orderItem.totalPrice) - Number(previousRefunds._sum.amount ?? 0);
      if (data.amount > remainingRefundable) {
        throw new Error(`أقصى مبلغ متاح للاسترجاع هو ${remainingRefundable.toFixed(2)} ج.م`);
      }

      // 4. Create Refund Record
      const refund = await tx.refund.create({
        data: {
          orderItemId: data.orderItemId,
          paymentId: data.paymentId,
          amount: data.amount,
          reason: data.reason,
          status: "pending",
          requestedById: authUser.userId,
          processedAt: null,
        },
      });

      return refund;
    });

    return successResponse({
      message: "تم تسجيل طلب الاسترجاع للمراجعة والتنفيذ لدى بوابة الدفع",
      refund: result,
    }, 201);
  } catch (error: any) {
    // If it's our custom thrown error message, return it cleanly
    if (error instanceof Error && error.message.includes("لازم تتحول لـ dispute")) {
      return errorResponse(error.message, 400);
    }
    return handleApiError(error);
  }
}
