/**
 * Cart API
 * ─────────────────────────────────────
 * GET    /api/cart  — عرض السلة مع عناصرها
 * DELETE /api/cart  — تفريغ السلة بالكامل
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

// ─────────────────────────────────────────────
// GET — عرض السلة
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const cart = await prisma.cart.findUnique({
      where: { userId: authUser.userId },
      include: {
        items: {
          include: {
            variant: {
              select: { id: true, name: true, price: true, stockQuantity: true },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                stockQuantity: true,
                status: true,
                vendor: {
                  select: {
                    id: true,
                    storeName: true,
                    slug: true,
                  },
                },
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
          orderBy: { product: { name: "asc" } },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return successResponse({ items: [], totalItems: 0, totalPrice: "0" });
    }

    // حساب الإجمالي
    let totalPrice = 0;
    const items = cart.items.map((item) => {
      const unitPrice = Number(item.variant?.price ?? item.product.price);
      const itemTotal = unitPrice * item.quantity;
      totalPrice += itemTotal;
      return {
        ...item,
        unitPrice: unitPrice.toFixed(2),
        itemTotal: itemTotal.toFixed(2),
      };
    });

    return successResponse({
      items,
      totalItems: items.length,
      totalPrice: totalPrice.toFixed(2),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE — تفريغ السلة
// ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const cart = await prisma.cart.findUnique({
      where: { userId: authUser.userId },
    });

    if (!cart) {
      return errorResponse("السلة فاضية أصلاً", 404);
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return successResponse({ message: "السلة اتفرغت" });
  } catch (error) {
    return handleApiError(error);
  }
}
