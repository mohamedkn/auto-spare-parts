/**
 * Admin Orders API
 * ─────────────────────────────────────
 * GET /api/admin/orders — عرض كل الطلبات
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authorization: Admin only
    await requireRole(request, "admin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { subOrders: { some: {} } },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1, // جيب أحدث محاولة دفع
          },
          subOrders: {
            include: {
              vendor: { select: { storeName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { subOrders: { some: {} } } }),
    ]);

    return successResponse({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
