/**
 * Vendor Orders API
 * ─────────────────────────────────────
 * GET /api/vendor/orders — عرض الطلبات الخاصة بمتجر البائع فقط
 *
 * القسم 7.6: استخدام index `vendorId` في `sub_orders` عشان الـ Performance.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    // Query Params للـ Pagination والفلترة
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | null;

    const where: Prisma.SubOrderWhereInput = {
      vendorId: vendor.id, // 🔒 Authorization: طلبات المتجر ده بس
      ...(status && { status }),
    };

    const [subOrders, total] = await Promise.all([
      prisma.subOrder.findMany({
        where,
        include: {
          deliveryJob: {
            select: {
              id: true,
              status: true,
              pickupOtp: true,
              driver: {
                select: {
                  user: {
                    select: { name: true, phone: true }
                  }
                }
              }
            }
          },
          order: {
            select: {
              orderNumber: true,
              shippingAddress: true,
              paymentStatus: true,
              createdAt: true,
              user: {
                select: { name: true, phone: true, email: true },
              },
            },
          },
          items: {
            include: {
              product: {
                select: { name: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subOrder.count({ where }),
    ]);

    return successResponse({
      subOrders,
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
