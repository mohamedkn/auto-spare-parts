/**
 * Public Single Product API
 * ─────────────────────────────────────
 * GET /api/products/:id — عرض تفاصيل منتج واحد (عام — بدون auth)
 *
 * بيستخدم الـ product ID (مش الـ slug) لأن الـ slug فريد لكل vendor
 * مش عالميًا — UNIQUE(vendor_id, slug) — فالـ ID أضمن.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/products/[id]">
) {
  try {
    const { id } = await ctx.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        status: "active",           // بس المنتجات النشطة
        vendor: { status: "approved" }, // من متاجر معتمدة بس
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        stockQuantity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            logoUrl: true,
          },
        },
        variants: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { position: "asc" },
          select: { id: true, url: true, position: true },
        },
      },
    });

    if (!product) {
      return errorResponse("المنتج مش موجود", 404);
    }

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}
