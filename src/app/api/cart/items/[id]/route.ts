/**
 * Cart Single Item API
 * ─────────────────────────────────────
 * PATCH  /api/cart/items/:id — تعديل الكمية
 * DELETE /api/cart/items/:id — إزالة عنصر من السلة
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { updateCartItemSchema } from "@/lib/validations/cart";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

// ─────────────────────────────────────────────
// PATCH — تعديل كمية عنصر
// ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/cart/items/[id]">
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await ctx.params;

    const body = await request.json();
    const data = updateCartItemSchema.parse(body);

    // تأكد العنصر تابع لسلة اليوزر ده
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId: authUser.userId },
      },
      include: {
        product: {
          select: { stockQuantity: true, name: true },
        },
        variant: {
          select: { stockQuantity: true, name: true },
        },
      },
    });

    if (!cartItem) {
      return errorResponse("العنصر مش موجود في سلتك", 404);
    }

    // تحقق أولي من الكمية
    const availableStock = cartItem.variant
      ? cartItem.variant.stockQuantity
      : cartItem.product.stockQuantity;

    const itemName = cartItem.variant
      ? `${cartItem.product.name} - ${cartItem.variant.name}`
      : cartItem.product.name;

    if (availableStock < data.quantity) {
      return errorResponse(
        `الكمية المتاحة من "${itemName}" هي ${availableStock} بس`,
        400
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity: data.quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE — إزالة عنصر من السلة
// ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/cart/items/[id]">
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await ctx.params;

    // تأكد العنصر تابع لسلة اليوزر ده
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId: authUser.userId },
      },
    });

    if (!cartItem) {
      return errorResponse("العنصر مش موجود في سلتك", 404);
    }

    await prisma.cartItem.delete({ where: { id } });

    return successResponse({ message: "العنصر اتشال من السلة" });
  } catch (error) {
    return handleApiError(error);
  }
}
