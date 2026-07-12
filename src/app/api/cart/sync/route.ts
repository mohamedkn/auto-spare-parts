import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

const syncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullish(),
    quantity: z.number().int().min(1).max(999),
  })).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { items } = syncCartSchema.parse(await request.json());

    const mergedItems = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
    for (const item of items) {
      const variantId = item.variantId ?? null;
      const key = `${item.productId}:${variantId ?? "base"}`;
      const existing = mergedItems.get(key);
      mergedItems.set(key, {
        productId: item.productId,
        variantId,
        quantity: (existing?.quantity ?? 0) + item.quantity,
      });
    }

    const normalizedItems = [...mergedItems.values()];
    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
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
        variants: { select: { id: true, name: true, stockQuantity: true } },
      },
    });

    for (const item of normalizedItems) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return errorResponse("أحد المنتجات غير موجود أو غير متاح", 400);

      const variant = item.variantId
        ? product.variants.find((candidate) => candidate.id === item.variantId)
        : null;
      if (item.variantId && !variant) return errorResponse(`الخيار المحدد من ${product.name} غير متاح`, 400);

      const availableStock = variant?.stockQuantity ?? product.stockQuantity;
      if (item.quantity > availableStock) {
        return errorResponse(`الكمية المطلوبة من ${product.name} أكبر من المخزون المتاح`, 400);
      }
    }

    const cart = await prisma.$transaction(async (tx) => {
      const currentCart = await tx.cart.upsert({
        where: { userId: authUser.userId },
        create: { userId: authUser.userId },
        update: { updatedAt: new Date() },
      });

      await tx.cartItem.deleteMany({ where: { cartId: currentCart.id } });
      if (normalizedItems.length > 0) {
        await tx.cartItem.createMany({
          data: normalizedItems.map((item) => ({ ...item, cartId: currentCart.id })),
        });
      }

      return tx.cart.findUnique({
        where: { id: currentCart.id },
        include: {
          items: {
            include: {
              product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
              variant: true,
            },
          },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return successResponse(cart);
  } catch (error) {
    return handleApiError(error);
  }
}
