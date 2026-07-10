/**
 * Auth Middleware / Guards
 * ─────────────────────────────────────
 * دوال مساعدة لحماية الـ API routes حسب الدور.
 *
 * الاستخدام في أي route handler:
 *   const user = await requireAuth(request);           // أي مستخدم مسجّل
 *   const user = await requireRole(request, "vendor"); // vendor فقط
 *   const user = await requireRole(request, "admin");  // admin فقط
 */

import { NextRequest } from "next/server";
import { verifyToken, type AuthTokenPayload } from "./jwt";
import { prisma } from "@/lib/db";

/**
 * يستخرج الـ token من الـ Authorization header ويتحقق منه.
 * بيرجع الـ payload لو صالح، أو null لو مفيش token أو غير صالح.
 */
export async function getAuthUser(
  request: NextRequest
): Promise<AuthTokenPayload | null> {
  let token = request.headers.get("authorization")?.startsWith("Bearer ")
    ? request.headers.get("authorization")?.slice(7)
    : null;

  if (token === "undefined" || token === "null") {
    token = null;
  }

  if (!token) {
    token = request.cookies.get("token")?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null; // token منتهي أو غير صالح
  }
}

/**
 * خطأ مخصص بيتضمن status code للاستخدام في الـ API responses
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * يتطلب أي مستخدم مسجّل دخول — بيرمي AuthError لو مفيش token صالح
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthTokenPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new AuthError("غير مصرّح — سجّل دخول الأول", 401);
  }
  const currentUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true },
  });
  if (!currentUser || currentUser.role !== user.role) {
    throw new AuthError("الجلسة لم تعد صالحة — سجّل الدخول مرة أخرى", 401);
  }
  return user;
}

/**
 * يتطلب دور محدد (أو أكتر من دور) — بيرمي AuthError لو الدور غلط
 */
export async function requireRole(
  request: NextRequest,
  ...roles: Array<"customer" | "vendor" | "admin" | "driver">
): Promise<AuthTokenPayload> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new AuthError(
      `صلاحيات غير كافية — مطلوب: ${roles.join(" أو ")}`,
      403
    );
  }
  if (user.role === "vendor") {
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: user.userId },
      select: { status: true },
    });
    if (!vendor || vendor.status === "suspended") {
      throw new AuthError("حساب المتجر موقوف", 403);
    }
  }
  if (user.role === "driver") {
    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: user.userId },
      select: { isVerified: true },
    });
    if (!driver?.isVerified) {
      throw new AuthError("حساب المندوب قيد المراجعة", 403);
    }
  }
  return user;
}
