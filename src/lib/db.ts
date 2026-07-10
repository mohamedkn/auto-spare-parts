/**
 * Prisma Client Singleton
 * ─────────────────────────────────────────────────────────────────
 * القسم 7.4 من PLAN.md:
 * Vercel serverless بيفتح connection جديدة لكل invocation.
 * الـ singleton pattern ده بيمنع إنشاء instances متعددة من PrismaClient
 * في بيئة التطوير (hot reload) وبيئة الإنتاج (serverless cold starts).
 *
 * الـ DATABASE_URL لازم يشاور على الـ pooled connection string بتاع Neon
 * (مش الـ direct connection) — راجع .env.example.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
