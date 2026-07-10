import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";
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

    if (job.status !== "accepted") {
      return errorResponse("المهمة ليست في حالة انتظار الاستلام", 400);
    }

    if (!checkRateLimit(`pickup-otp:${driver.id}:${job.id}`, 5, 5 * 60_000)) {
      return errorResponse("محاولات كثيرة. حاول مرة أخرى بعد خمس دقائق", 429);
    }

    if (job.pickupOtp !== data.otp) {
      return errorResponse("رمز التحقق غير صحيح", 400);
    }

    // OTP matches, update status
    const updatedJob = await prisma.$transaction(async (tx) => {
      const transition = await tx.deliveryJob.updateMany({
        where: { id, driverId: driver.id, status: "accepted" },
        data: { 
          status: "picked_up",
          pickedUpAt: new Date(),
          pickupOtp: null,
        },
      });
      if (transition.count !== 1) throw new Error("PICKUP_ALREADY_PROCESSED");

      // Sync SubOrder
      await tx.subOrder.update({
        where: { id: job.subOrderId },
        data: { status: "shipped" },
      });

      return tx.deliveryJob.findUnique({ where: { id }, include: { subOrder: true } });
    });

    return successResponse({
      message: "تم تأكيد الاستلام بنجاح",
      job: updatedJob
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PICKUP_ALREADY_PROCESSED") {
      return errorResponse("تم تأكيد استلام هذه المهمة بالفعل", 409);
    }
    return handleApiError(error);
  }
}
