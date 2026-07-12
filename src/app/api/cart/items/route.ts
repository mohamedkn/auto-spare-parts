/**
 * Cart Items API
 * ─────────────────────────────────────
 * POST /api/cart/items — إضافة منتج للسلة (UPSERT — لو موجود يزوّد الكمية)
 *
 * القسم 6 (🆕v3): UNIQUE(cart_id, product_id) يجبر UPSERT مش INSERT.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { addToCartSchema } from "@/lib/validations/cart";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const body = await request.json();
    const data = addToCartSchema.parse(body);

    // تأكد المنتج موجود ونشط ومن متجر معتمد
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        status: "active",
        vendor: { status: "approved" },
        OR: [
          { isPrivate: false },
          { isPrivate: true, quoteBid: { inquiry: { userId: authUser.userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        price: true,
        variants: data.variantId ? {
          where: { id: data.variantId },
          select: { id: true, name: true, stockQuantity: true, price: true }
        } : undefined,
      },
    });

    if (!product) {
      return errorResponse("المنتج مش موجود أو مش متاح حاليًا", 404);
    }

    if (data.variantId) {
      const variant = product.variants?.[0];
      if (!variant) {
        return errorResponse("هذا الخيار من المنتج غير متاح", 404);
      }
      if (variant.stockQuantity < data.quantity) {
        return errorResponse(
          `الكمية المتاحة من "${product.name} - ${variant.name}" هي ${variant.stockQuantity} بس`,
          400
        );
      }
    } else {
      // تحقق أولي من الكمية
      if (product.stockQuantity < data.quantity) {
        return errorResponse(
          `الكمية المتاحة من "${product.name}" هي ${product.stockQuantity} بس`,
          400
        );
      }
    }

    // جيب أو أنشئ السلة (سلة واحدة لكل يوزر — UNIQUE على user_id)
    const cart = await prisma.cart.upsert({
      where: { userId: authUser.userId },
      create: { userId: authUser.userId },
      update: {}, // مش محتاج يتحدث حاجة
    });

    // UPSERT manually since @@index([cartId, productId, variantId]) is not @@unique (Prisma doesn't like nulls in unique)
    let cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId || null,
      },
    });

    if (cartItem) {
      const availableStock = data.variantId
        ? product.variants?.[0]?.stockQuantity ?? 0
        : product.stockQuantity;
      const requestedTotal = cartItem.quantity + data.quantity;
      if (requestedTotal > availableStock) {
        return errorResponse(
          `الكمية الإجمالية المطلوبة من "${product.name}" أكبر من المخزون المتاح (${availableStock})`,
          400
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: { increment: data.quantity } },
        include: {
          product: {
            select: {
              id: true, name: true, price: true,
              images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
            },
          },
          variant: { select: { id: true, name: true, price: true } },
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          variantId: data.variantId || null,
          quantity: data.quantity,
        },
        include: {
          product: {
            select: {
              id: true, name: true, price: true,
              images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
            },
          },
          variant: { select: { id: true, name: true, price: true } },
        },
      });
    }

    return successResponse(cartItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
