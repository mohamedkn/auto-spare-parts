/**
 * Auth Module — Barrel Export
 * ─────────────────────────────────────
 * نقطة وصول واحدة لكل أدوات الـ Auth.
 */

export { signToken, verifyToken, type AuthTokenPayload } from "./jwt";
export { hashPassword, comparePassword } from "./password";
export {
  getAuthUser,
  requireAuth,
  requireRole,
  AuthError,
} from "./middleware";
