import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { successResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { buildProductWhere, inferVehicleFilters, scoreProductRelevance } from "@/lib/search/product-search";
import { productQuerySchema } from "@/lib/validations/product";
import { parseVehicleMarkets } from "@/lib/vehicles/markets";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stockQuantity: true,
  status: true,
  oemNumber: true,
  partNumber: true,
  brand: true,
  condition: true,
  placement: true,
  createdAt: true,
  vendor: { select: { id: true, storeName: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  variants: true,
  images: {
    select: { url: true },
    orderBy: { position: "asc" as const },
    take: 1,
  },
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductSelect;

function orderByFor(sortBy: string): Prisma.ProductOrderByWithRelationInput {
  if (sortBy === "price_asc") return { price: "asc" };
  if (sortBy === "price_desc") return { price: "desc" };
  if (sortBy === "oldest") return { createdAt: "asc" };
  return { createdAt: "desc" };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitSort = searchParams.get("sortBy");
    const query = productQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      oemNumber: searchParams.get("oemNumber") || undefined,
      brand: searchParams.get("brand") || undefined,
      condition: searchParams.get("condition") || undefined,
      vehicleMakeId: searchParams.get("vehicleMakeId") || undefined,
      vehicleModelId: searchParams.get("vehicleModelId") || undefined,
      year: searchParams.get("year") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      minRating: searchParams.get("minRating") || undefined,
      inStock: searchParams.get("inStock") || undefined,
      sortBy: explicitSort || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const sortBy = explicitSort || (query.search ? "relevance" : query.sortBy);
    let productIdsFromRating: string[] | undefined;

    if (query.minRating !== undefined) {
      const rows = await prisma.$queryRaw<Array<{ product_id: string }>>`
        SELECT "product_id"
        FROM "reviews"
        GROUP BY "product_id"
        HAVING AVG("rating") >= ${Number(query.minRating)}
      `;
      productIdsFromRating = rows.map((row) => row.product_id);
    }

    const vehicleCatalog = query.search
      ? await prisma.vehicleMake.findMany({
          select: { id: true, name: true, models: { select: { id: true, name: true } } },
        })
      : [];
    const inferredVehicle = query.search ? inferVehicleFilters(query.search, vehicleCatalog) : null;

    const where = buildProductWhere({
      ...query,
      condition: query.condition,
      vehicleMarkets: parseVehicleMarkets(query.vehicleMarkets),
      vehicleMakeId: query.vehicleMakeId || inferredVehicle?.vehicleMakeId,
      vehicleModelId: query.vehicleModelId || inferredVehicle?.vehicleModelId,
      year: query.year || inferredVehicle?.year,
      productIdsFromRating,
    });
    const relevanceMode = Boolean(query.search && sortBy === "relevance");
    const candidateLimit = relevanceMode ? 200 : query.limit;
    const skip = relevanceMode ? 0 : (query.page - 1) * query.limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSelect,
        orderBy: orderByFor(sortBy),
        skip,
        take: candidateLimit,
      }),
      prisma.product.count({ where }),
    ]);

    let formattedProducts = products.map((product) => {
      const reviewsCount = product.reviews.length;
      const avgRating = reviewsCount
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
        : 0;
      return {
        ...product,
        avgRating: Number(avgRating.toFixed(2)),
        reviewsCount,
        reviews: undefined,
      };
    });

    if (relevanceMode && query.search) {
      formattedProducts = formattedProducts
        .map((product) => ({
          ...product,
          relevanceScore: scoreProductRelevance(product, query.search || ""),
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore || b.avgRating - a.avgRating)
        .slice((query.page - 1) * query.limit, query.page * query.limit);
    } else if (sortBy === "rating_desc") {
      formattedProducts.sort((a, b) => b.avgRating - a.avgRating);
    }

    const response = successResponse({
      products: formattedProducts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      search: query.search
        ? {
            query: query.search,
            sortBy,
            candidateLimit: relevanceMode ? candidateLimit : undefined,
            inferredVehicle,
          }
        : undefined,
    });
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
