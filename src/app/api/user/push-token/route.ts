import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const pushTokenSchema = z.object({
  pushToken: z.string().min(1, "pushToken مطلوب"),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const data = pushTokenSchema.parse(body);

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { expoPushToken: data.pushToken },
    });

    return successResponse({ message: "تم تحديث رمز الإشعارات بنجاح" });
  } catch (error) {
    return handleApiError(error);
  }
}
