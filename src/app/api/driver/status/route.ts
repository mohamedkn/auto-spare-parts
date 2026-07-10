import { NextRequest } from "next/server";
import { z } from "zod";

import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

const driverStatusSchema = z.object({ status: z.enum(["online", "offline"]) });

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "driver");
    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
      select: { status: true, isVerified: true },
    });
    if (!driver) return errorResponse("حساب السائق غير موجود", 404);
    return successResponse(driver);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "driver");
    const data = driverStatusSchema.parse(await request.json());
    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
      select: { id: true, status: true },
    });
    if (!driver) return errorResponse("حساب السائق غير موجود", 404);

    if (data.status === "offline") {
      const activeJob = await prisma.deliveryJob.findFirst({
        where: { driverId: driver.id, status: { in: ["accepted", "picked_up", "on_the_way"] } },
        select: { id: true },
      });
      if (activeJob) return errorResponse("لا يمكنك إيقاف استقبال الطلبات أثناء وجود رحلة نشطة", 409);
    }

    const updated = await prisma.deliveryDriver.update({
      where: { id: driver.id },
      data: { status: data.status },
      select: { status: true },
    });
    return successResponse({ status: updated.status });
  } catch (error) {
    return handleApiError(error);
  }
}
