/**
 * POST /api/orders/:id/pay-instapay
 * ─────────────────────────────────────
 * تأكيد التحويل اليدوي لـ InstaPay (القسم 10.2).
 *
 * العميل بيرفع رقم التحويل (Transaction ID) بعد ما يحوّل الفلوس.
 * الطلب بيفضل 'pending_verification' لحد ما الأدمن يوافق.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const instapaySubmitSchema = z.object({
  transactionId: z.string().min(5, "رقم العملية مطلوب"),
  // ممكن مستقبلاً يتضاف حقل receiptUrl لو العميل هيرفع صورة
});

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/pay-instapay">
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await ctx.params;

    const body = await request.json();
    const data = instapaySubmitSchema.parse(body);

    // 1. تأكد إن الطلب يخص العميل ده، وحالته تسمح
    const order = await prisma.order.findUnique({
      where: { id, userId: authUser.userId },
      include: {
        payments: {
          where: { provider: "instapay" },
        },
      },
    });

    if (!order) {
      return errorResponse("الطلب مش موجود", 404);
    }

    if (order.paymentStatus === "paid") {
      return errorResponse("الطلب ده مدفوع بالفعل", 400);
    }

    // 2. تحديث سجل الدفع برقم العملية
    const instapayPayment = order.payments[0];

    if (!instapayPayment) {
      return errorResponse("الطلب ده مش متحدد إنه هيدفع بـ InstaPay", 400);
    }

    // Upsert أو Update لبيانات الدفع
    await prisma.payment.update({
      where: { id: instapayPayment.id },
      data: {
        providerTransactionId: data.transactionId, // تحديث برقم العملية الفعلي
        status: "pending_verification",
      },
    });

    // تأكيد إن الـ Order لسه pending_verification
    if (order.paymentStatus !== "pending_verification") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "pending_verification" },
      });
    }

    return successResponse({
      message: "تم استلام تأكيد الدفع. جاري المراجعة من الإدارة.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
