import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PaymobWebhookSchema, verifyWebhookSignature } from "@/lib/payments/paymob";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendOrderConfirmationEmail } from "@/lib/services/email";

export async function POST(request: NextRequest) {
  try {
    const hmac = new URL(request.url).searchParams.get("hmac");
    if (!hmac) return errorResponse("Missing HMAC signature", 401);

    const rawPayload: unknown = await request.json();
    if (!verifyWebhookSignature(rawPayload, hmac)) return errorResponse("Invalid signature", 401);

    const payload = PaymobWebhookSchema.parse(rawPayload);
    if (payload.type !== "TRANSACTION") {
      return successResponse({ message: "Ignored non-transaction webhook" });
    }

    const { obj } = payload;
    const orderNumber = String(obj.order.merchant_order_id);
    const transactionId = String(obj.id);
    const expectedCurrency = obj.currency.toUpperCase();

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: { select: { email: true } },
        payments: { where: { provider: "paymob" }, orderBy: { createdAt: "asc" } },
        subOrders: {
          select: {
            id: true,
            subtotal: true,
            items: { select: { productId: true, variantId: true, quantity: true } },
            vendor: { select: { owner: { select: { id: true, expoPushToken: true } } } },
          },
        },
      },
    });
    if (!order) return errorResponse("Order not found", 404);

    const payment = order.payments[0];
    if (!payment) return errorResponse("Paymob payment record not found", 409);

    const expectedAmountCents = Math.round(Number(order.totalAmount) * 100);
    if (expectedCurrency !== "EGP" || obj.amount_cents !== expectedAmountCents) {
      console.error("Paymob webhook amount/currency mismatch", {
        orderNumber,
        receivedAmountCents: obj.amount_cents,
        expectedAmountCents,
        receivedCurrency: expectedCurrency,
      });
      return errorResponse("Payment amount mismatch", 409);
    }

    if (obj.pending) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerTransactionId: transactionId, status: "pending" },
      });
      return successResponse({ message: "Pending transaction recorded" });
    }

    const isSuccess = obj.success;
    let transitionedToPaid = false;

    await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!currentPayment) throw new Error("Payment disappeared during webhook processing");

      if (currentPayment.status === "succeeded" || currentPayment.status === "failed") return;

      const duplicateTransaction = await tx.payment.findFirst({
        where: {
          provider: "paymob",
          providerTransactionId: transactionId,
          id: { not: currentPayment.id },
        },
        select: { id: true },
      });
      if (duplicateTransaction) throw new Error("Duplicate Paymob transaction ID");

      await tx.payment.update({
        where: { id: currentPayment.id },
        data: {
          providerTransactionId: transactionId,
          status: isSuccess ? "succeeded" : "failed",
          paidAt: isSuccess ? new Date() : null,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: isSuccess ? "paid" : "failed" },
      });

      if (isSuccess) {
        await tx.subOrder.updateMany({
          where: { orderId: order.id, status: "pending" },
          data: { status: "confirmed" },
        });
        await tx.notification.createMany({
          data: order.subOrders.map((subOrder) => ({
            userId: subOrder.vendor.owner.id,
            title: "طلب جديد! 📦",
            message: `لديك طلب مدفوع جديد بقيمة ${Number(subOrder.subtotal).toLocaleString("ar-EG")} ج.م. يرجى مراجعته.`,
            type: "ORDER_RECEIVED",
          })),
        });
        transitionedToPaid = true;
      } else {
        await tx.subOrder.updateMany({
          where: { orderId: order.id, status: { in: ["pending", "confirmed"] } },
          data: { status: "cancelled" },
        });
        for (const subOrder of order.subOrders) {
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

    if (transitionedToPaid && order.user.email) {
      void sendOrderConfirmationEmail(order.user.email, order.orderNumber, Number(order.totalAmount));
    }
    if (transitionedToPaid) {
      const { sendPushNotification } = await import("@/lib/expoPush");
      for (const subOrder of order.subOrders) {
        if (!subOrder.vendor.owner.expoPushToken) continue;
        void sendPushNotification(
          subOrder.vendor.owner.expoPushToken,
          "طلب جديد! 📦",
          `لديك طلب مدفوع جديد بقيمة ${Number(subOrder.subtotal).toLocaleString("ar-EG")} ج.م. يرجى مراجعته.`,
        );
      }
    }

    return successResponse({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Paymob webhook processing failed", error);
    return errorResponse("Internal server error processing webhook", 500);
  }
}
