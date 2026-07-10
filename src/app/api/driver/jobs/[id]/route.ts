import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(
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
      include: {
        subOrder: {
          include: {
            order: {
              select: { shippingAddress: true }
            },
            vendor: {
              select: { storeName: true, address: true, owner: { select: { phone: true } } }
            }
          }
        }
      }
    });

    if (!job) {
      return errorResponse("المهمة غير موجودة", 404);
    }

    if (job.driverId !== driver.id) {
      return errorResponse("هذه المهمة غير مسندة إليك", 403);
    }

    // Map the payload similar to accept api
    const payload: any = { ...job };
    if (payload.subOrder?.vendor) {
      payload.subOrder.vendor.phone = payload.subOrder.vendor.owner?.phone;
      delete payload.subOrder.vendor.owner;
    }

    return successResponse({ job: payload });
  } catch (error) {
    return handleApiError(error);
  }
}
