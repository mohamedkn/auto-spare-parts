/**
 * Password Hashing Utilities
 * ─────────────────────────────────────
 * bcryptjs لعمل hash والتحقق من كلمات السر.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * عمل hash لكلمة السر قبل تخزينها في قاعدة البيانات
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * مقارنة كلمة سر مُدخلة بالـ hash المخزّن
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
