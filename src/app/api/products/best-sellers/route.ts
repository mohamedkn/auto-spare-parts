import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { successResponse, handleApiError } from "@/lib/api-response";

const bestSellerInclude = {
  images: { take: 1, select: { url: true }, orderBy: { position: "asc" as const } },
  vendor: { select: { storeName: true } },
} satisfies Prisma.ProductInclude;

type BestSellerProduct = Prisma.ProductGetPayload<{ include: typeof bestSellerInclude }>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Fetch Actual Best Sellers (Aggregation)
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        subOrder: {
          status: "delivered",
          order: { payments: { some: { status: "succeeded" } } },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    let bestSellers: BestSellerProduct[] = [];

    if (topItems.length > 0) {
      const productIds = topItems.map(item => item.productId);
      const fetchedProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, status: "active", vendor: { status: "approved" } },
        include: bestSellerInclude,
      });
      
      // Sort based on aggregated sales order
      bestSellers = topItems
        .map(item => fetchedProducts.find(p => p.id === item.productId))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);
    }
    
    // Fallback if no sales exist in the DB yet: fetch oldest products or featured ones
    if (bestSellers.length === 0) {
      bestSellers = await prisma.product.findMany({
        where: { status: "active", vendor: { status: "approved" } },
        include: bestSellerInclude,
        take: limit,
        orderBy: { createdAt: "asc" }, // Oldest as fallback
      });
    }

    return successResponse({
      products: bestSellers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
