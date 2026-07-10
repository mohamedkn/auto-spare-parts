/**
 * Order Number Generator
 * ─────────────────────────────────────
 * ينشئ رقم طلب فريد بالصيغة: ZEE-YYYYMMDD-XXXX
 * مثال: ZEE-20240615-A3B2
 */

export function generateOrderNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const randomPart = randomBytes(6).toString("hex").toUpperCase();

  return `ZEE-${datePart}-${randomPart}`;
}
import { randomBytes } from "node:crypto";
