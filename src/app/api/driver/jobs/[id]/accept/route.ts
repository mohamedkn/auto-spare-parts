import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/driver/jobs/[id]/accept">
) {
  try {
    const authUser = await requireRole(request, "driver");
    const { id } = await ctx.params;
    
    // We expect the driver to send the current version they saw
    const body = await request.json();
    const { version } = body;

    if (typeof version !== 'number') {
      return errorResponse("يجب إرسال رقم النسخة (version) الحالية للطلب", 400);
    }

    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
    });

    if (!driver || !driver.isVerified || driver.status === "offline") {
      return errorResponse("حسابك غير مؤهل لقبول الطلبات حالياً.", 403);
    }

    const targetJob = await prisma.deliveryJob.findUnique({
      where: { id },
      select: { isCod: true, codAmountToCollect: true },
    });
    if (!targetJob) return errorResponse("المهمة غير موجودة", 404);
    if (
      targetJob.isCod
      && Number(driver.cashOnHandBalance) + Number(targetJob.codAmountToCollect) > Number(driver.cashLimit)
    ) {
      return errorResponse("تجاوزت الحد المسموح للكاش المحصل. قم بتسوية الرصيد أولاً.", 403);
    }

    // Check if driver already has an active job
    const activeJobsCount = await prisma.deliveryJob.count({
      where: {
        driverId: driver.id,
        status: { in: ["accepted", "picked_up", "on_the_way"] }
      }
    });

    if (activeJobsCount > 0) {
      return errorResponse("عفواً، لا يمكنك قبول طلب جديد حتى تقوم بتوصيل الطلب الحالي.", 400);
    }

    // Attempt to accept the job using optimistic locking
    const updatedJob = await prisma.$transaction(async (tx) => {
      const transition = await tx.deliveryJob.updateMany({
        where: {
          id,
          version,
          status: { in: ["pending", "broadcasted"] },
        },
        data: {
          status: "accepted",
          driverId: driver.id,
          acceptedAt: new Date(),
          version: { increment: 1 }
        }
      });

      if (transition.count === 1) {
        await tx.deliveryDriver.update({
          where: { id: driver.id },
          data: { status: "busy" },
        });
      }
      return transition;
    });

    if (updatedJob.count === 0) {
      // Either it doesn't exist, already accepted, or version mismatch
      return errorResponse("عفواً، تم قبول هذا الطلب من قبل مندوب آخر أو تغيرت حالته.", 409);
    }

    // Fetch the updated job to return it
    const jobDetails = await prisma.deliveryJob.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: {
            vendor: {
              select: { 
                storeName: true,
                owner: { select: { phone: true } }
              }
            }
          }
        }
      }
    });

    if (jobDetails?.subOrder?.vendor) {
      const vendor = jobDetails.subOrder.vendor as any;
      vendor.phone = vendor.owner?.phone;
      delete vendor.owner;
    }

    return successResponse({
      message: "تم قبول الطلب بنجاح. يرجى التوجه للتاجر لاستلام الشحنة.",
      job: jobDetails
    });

  } catch (error) {
    return handleApiError(error);
  }
}
