import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const verifyDriverSchema = z.object({
  isVerified: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, "admin");
    const params = await ctx.params;
    const { id } = params;

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
    });

    if (!driver) {
      return errorResponse("السائق غير موجود", 404);
    }

    const body = await request.json();
    const data = verifyDriverSchema.parse(body);

    const updatedDriver = await prisma.deliveryDriver.update({
      where: { id },
      data: { isVerified: data.isVerified },
    });

    return successResponse({
      message: data.isVerified ? "تم توثيق السائق بنجاح" : "تم إلغاء توثيق السائق",
      driver: updatedDriver
    });
  } catch (error) {
    return handleApiError(error);
  }
}
