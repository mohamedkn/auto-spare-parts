/**
 * API Response Helpers
 * ─────────────────────────────────────
 * دوال مساعدة لتوحيد شكل الـ API responses.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/middleware";

/**
 * Response ناجح
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Response خطأ
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * معالجة الأخطاء الموحدة — بيتعامل مع Zod errors و AuthError والأخطاء العامة
 */
export function handleApiError(error: unknown) {
  // Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => issue.message);
    return errorResponse(messages.join(", "), 422);
  }

  // Auth errors (401/403)
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.statusCode);
  }

  // Prisma unique constraint violation
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return errorResponse("البيانات دي موجودة بالفعل (تكرار)", 409);
  }

  // أخطاء غير متوقعة — لوج في السيرفر بس مترجعش تفاصيل للعميل
  console.error("[API Error]", error);
  return errorResponse("حدث خطأ غير متوقع", 500);
}
