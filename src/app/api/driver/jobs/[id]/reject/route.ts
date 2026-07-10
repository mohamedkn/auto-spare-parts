import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

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

    const job = await prisma.deliveryJob.findUnique({
      where: { id },
    });

    if (!job) {
      return errorResponse("المهمة غير موجودة", 404);
    }

    if (job.driverId !== driver.id) {
      return errorResponse("هذه المهمة غير مسندة إليك", 403);
    }

    if (job.status !== "accepted") {
      return errorResponse("لا يمكنك إلغاء الطلب بعد استلامه من التاجر", 400);
    }

    // Reject the job (return to broadcasted state)
    const updatedJob = await prisma.$transaction(async (tx) => {
      const transition = await tx.deliveryJob.updateMany({
        where: { id, driverId: driver.id, status: "accepted" },
        data: {
          status: "broadcasted",
          driverId: null,
          acceptedAt: null,
          assignmentAttempt: { increment: 1 }
        }
      });
      if (transition.count !== 1) throw new Error("JOB_ALREADY_TRANSITIONED");
      await tx.deliveryDriver.update({ where: { id: driver.id }, data: { status: "online" } });
      return tx.deliveryJob.findUnique({ where: { id } });
    });

    return successResponse({
      message: "تم إلغاء الطلب بنجاح وهو الآن متاح لمناديب آخرين",
      job: updatedJob
    });

  } catch (error) {
    if (error instanceof Error && error.message === "JOB_ALREADY_TRANSITIONED") {
      return errorResponse("تغيرت حالة المهمة بالفعل", 409);
    }
    return handleApiError(error);
  }
}
