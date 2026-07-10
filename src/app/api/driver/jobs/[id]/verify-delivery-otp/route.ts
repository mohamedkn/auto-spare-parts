import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";
import { DRIVER_EARNING_EGP, DELIVERY_PLATFORM_COMMISSION_EGP } from "@/lib/delivery/pricing";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const verifyOtpSchema = z.object({
  otp: z.string().min(4).max(6),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(request, "driver");
    const params = await ctx.params;
    const { id } = params;

    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });

    if (!driver) {
      return errorResponse("حساب السائق غير موجود", 404);
    }

    const body = await request.json();
    const data = verifyOtpSchema.parse(body);

    const job = await prisma.deliveryJob.findUnique({
      where: { id },
      include: { subOrder: true }
    });

    if (!job) {
      return errorResponse("المهمة غير موجودة", 404);
    }

    if (job.driverId !== driver.id) {
      return errorResponse("هذه المهمة غير مسندة إليك", 403);
    }

    if (job.status !== "picked_up") {
      return errorResponse("المهمة لم يتم استلامها بعد من التاجر", 400);
    }

    if (!checkRateLimit(`delivery-otp:${driver.id}:${job.id}`, 5, 5 * 60_000)) {
      return errorResponse("محاولات كثيرة. حاول مرة أخرى بعد خمس دقائق", 429);
    }

    if (job.deliveryOtp !== data.otp) {
      return errorResponse("رمز التحقق غير صحيح", 400);
    }

    // Check if COD is required but not collected
    // According to architecture, confirm-cod-collected might be a separate step,
    // or we can just require the app to do it before / or together.
    // For safety, let's just mark it delivered here. The WalletTransaction for COD
    // will be handled in confirm-cod-collected if we keep them separate.
    
    const updatedJob = await prisma.$transaction(async (tx) => {
      const transition = await tx.deliveryJob.updateMany({
        where: { id, driverId: driver.id, status: "picked_up" },
        data: { 
          status: "delivered",
          deliveredAt: new Date(),
          deliveryOtp: null,
        },
      });
      if (transition.count !== 1) throw new Error("DELIVERY_ALREADY_PROCESSED");

      // Sync SubOrder
      await tx.subOrder.update({
        where: { id: job.subOrderId },
        data: { status: "delivered" },
      });

      const remainingSubOrders = await tx.subOrder.count({
        where: {
          orderId: job.subOrder.orderId,
          status: { notIn: ["delivered", "cancelled"] },
        },
      });
      if (remainingSubOrders === 0) {
        await tx.payment.updateMany({
          where: {
            orderId: job.subOrder.orderId,
            provider: { in: ["cash_on_delivery", "cod"] },
            status: "pending",
          },
          data: { status: "succeeded", paidAt: new Date() },
        });
        if (job.isCod) {
          await tx.order.update({
            where: { id: job.subOrder.orderId },
            data: { paymentStatus: "paid" },
          });
        }
      }

      // Wallet Logic
      const driverEarning = DRIVER_EARNING_EGP;
      
      // 1. Update driver balances
      const updatedDriver = await tx.deliveryDriver.update({
        where: { id: driver.id },
        data: {
          walletBalance: { increment: driverEarning },
          status: "online",
          ...(job.isCod ? { cashOnHandBalance: { increment: job.codAmountToCollect } } : {})
        }
      });

      // 2. Create Driver Earning Transaction
      await tx.walletTransaction.create({
        data: {
          walletOwnerType: "driver",
          walletOwnerId: driver.id,
          type: "credit",
          amount: driverEarning,
          balanceAfter: updatedDriver.walletBalance,
          relatedDeliveryJobId: job.id
        }
      });

      // 3. Create COD Collected Transaction (If COD)
      if (job.isCod && Number(job.codAmountToCollect) > 0) {
        await tx.walletTransaction.create({
          data: {
            walletOwnerType: "driver",
            walletOwnerId: driver.id,
            type: "cod_collected",
            amount: job.codAmountToCollect,
            balanceAfter: updatedDriver.cashOnHandBalance, // Storing cash on hand as balanceAfter for this type
            relatedDeliveryJobId: job.id
          }
        });
      }

      // 4. Create Platform Earning Transaction
      await tx.walletTransaction.create({
        data: {
          walletOwnerType: "platform",
          walletOwnerId: "00000000-0000-0000-0000-000000000000", // Valid UUID for platform
          type: "credit",
          amount: DELIVERY_PLATFORM_COMMISSION_EGP,
          balanceAfter: 0, // Ignored or aggregated later
          relatedDeliveryJobId: job.id
        }
      });

      return tx.deliveryJob.findUnique({ where: { id }, include: { subOrder: true } });
    });

    return successResponse({
      message: "تم تأكيد التسليم بنجاح",
      job: updatedJob
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DELIVERY_ALREADY_PROCESSED") {
      return errorResponse("تم تأكيد تسليم هذه المهمة بالفعل", 409);
    }
    return handleApiError(error);
  }
}
