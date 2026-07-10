/**
 * POST /api/auth/login
 * ─────────────────────────────────────
 * تسجيل الدخول — يعمل لكل الأدوار (customer/vendor/admin).
 *
 * Body: { email, password }
 * Response: { user, token } أو خطأ 401
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { cookies } from "next/headers";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip, 5, 60000)) {
      return errorResponse("محاولات كثيرة جداً، يرجى المحاولة بعد قليل", 429);
    }

    const body = await request.json();
    const data = loginSchema.parse(body);

    // ابحث عن اليوزر بالإيميل
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        // لو vendor، جيب بيانات المتجر (خصوصًا الـ status)
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      // رسالة عامة عشان ما نكشفش هل الإيميل موجود ولا لا
      return errorResponse("إيميل أو كلمة سر غلط", 401);
    }

    // تحقق من كلمة السر
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return errorResponse("إيميل أو كلمة سر غلط", 401);
    }

    // أنشئ الـ token
    const token = await signToken({ userId: user.id, role: user.role });

    // إعداد HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // شيل الـ passwordHash من الـ response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return successResponse({ user: userWithoutPassword, token });
  } catch (error) {
    return handleApiError(error);
  }
}
