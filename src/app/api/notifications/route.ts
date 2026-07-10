import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const notifications = await prisma.notification.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return successResponse({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: authUser.userId, read: false },
      data: { read: true },
    });

    return successResponse({ message: "Marked all as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
