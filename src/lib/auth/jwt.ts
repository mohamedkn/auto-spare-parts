/**
 * JWT Utilities
 * ─────────────────────────────────────
 * يستخدم مكتبة `jose` لأنها متوافقة مع Edge Runtime (Vercel).
 * الـ token بيحمل: userId, role.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  role: "customer" | "vendor" | "admin" | "driver";
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET مفقود أو قصير — لازم يكون 32 حرف على الأقل. راجع .env.example"
    );
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || "7d";
}

/**
 * إنشاء JWT token جديد
 */
export async function signToken(payload: {
  userId: string;
  role: "customer" | "vendor" | "admin" | "driver";
}): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getExpiresIn())
    .sign(getJwtSecret());
}

/**
 * التحقق من JWT token وإرجاع الـ payload
 * بيرمي error لو الـ token منتهي أو غير صالح
 */
export async function verifyToken(
  token: string
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as AuthTokenPayload;
}
