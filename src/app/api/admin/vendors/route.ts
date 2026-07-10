/**
 * Admin Vendors API
 * ─────────────────────────────────────
 * GET /api/admin/vendors — عرض كل المتاجر (للمراجعة)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, handleApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authorization: Admin only
    await requireRole(request, "admin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") as "pending" | "approved" | "suspended" | null;

    const where: Prisma.VendorWhereInput = {
      ...(status && { status }),
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          owner: {
            select: { name: true, email: true, phone: true },
          },
          _count: {
            select: { products: true, subOrders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return successResponse({
      vendors,
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
