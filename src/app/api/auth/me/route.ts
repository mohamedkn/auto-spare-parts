/**
 * GET /api/auth/me
 * ─────────────────────────────────────
 * يرجع بيانات المستخدم الحالي من الـ JWT token.
 * مفيد للـ frontend عشان يعرف مين اللي مسجّل دخول.
 *
 * Headers: Authorization: Bearer <token>
 * Response: { user } أو خطأ 401
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth/middleware";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            status: true,
            commissionRate: true,
          },
        },
      },
    });

    if (!user) {
      // اليوزر اللي في الـ token ممكن يكون اتمسح
      return handleApiError(new AuthError("الحساب مش موجود", 401));
    }

    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً").optional(),
  phone: z.string().min(10, "رقم الهاتف غير صحيح").optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      }
    });

    return successResponse({
      message: "تم تحديث الملف الشخصي بنجاح",
      user: updatedUser
    });
  } catch (error) {
    return handleApiError(error);
  }
}

