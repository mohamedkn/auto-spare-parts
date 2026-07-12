import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await props.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (!product) {
      return errorResponse("المنتج غير موجود", 404);
    }

    // 1. "Customers also bought"
    // Find orders that contain this product
    const ordersWithThisProduct = await prisma.orderItem.findMany({
      where: { productId },
      select: { subOrder: { select: { orderId: true } } },
    });

    const orderIds = ordersWithThisProduct.map((oi) => oi.subOrder.orderId);

    let similarProducts: any[] = [];
    const seenIds = new Set([productId]);

    if (orderIds.length > 0) {
      // Find other products in these orders
      const coPurchasedItems = await prisma.orderItem.findMany({
        where: {
          subOrder: { orderId: { in: orderIds } },
          productId: { not: productId },
        },
        select: {
          productId: true,
        },
      });

      // Count occurrences
      const productCounts: Record<string, number> = {};
      coPurchasedItems.forEach((item) => {
        productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
      });

      // Sort by frequency
      const sortedIds = Object.keys(productCounts).sort(
        (a, b) => productCounts[b] - productCounts[a]
      );

      if (sortedIds.length > 0) {
        similarProducts = await prisma.product.findMany({
          where: { id: { in: sortedIds.slice(0, 5) }, status: "active", isPrivate: false },
          include: { images: { take: 1, select: { url: true } } },
        });

        similarProducts.forEach((p) => seenIds.add(p.id));
      }
    }

    // 2. Fallback: Same category
    if (similarProducts.length < 5 && product.categoryId) {
      const moreProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { notIn: Array.from(seenIds) },
          status: "active",
          isPrivate: false,
        },
        include: { images: { take: 1, select: { url: true } } },
        take: 5 - similarProducts.length,
      });

      similarProducts = [...similarProducts, ...moreProducts];
    }

    return successResponse(similarProducts);
  } catch (error) {
    return handleApiError(error);
  }
}
