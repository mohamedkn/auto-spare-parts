import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { createReviewSchema } from "@/lib/validations/review";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id: productId } = await ctx.params;

    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return errorResponse("المنتج مش موجود", 404);
    }

    // 2. Verify purchase (User must have an OrderItem for this product in a Delivered suborder)
    const validOrderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        subOrder: {
          status: "delivered", // 🆕 Phase 2.5: Must be delivered
          order: {
            userId: authUser.userId,
          },
        },
      },
      select: { id: true },
    });

    if (!validOrderItem) {
      return errorResponse("لازم تكون استلمت المنتج ده قبل ما تقدر تقيّمه", 403);
    }

    // 3. Create or Update Review inside a transaction and update Vendor rating
    const review = await prisma.$transaction(async (tx) => {
      const savedReview = await tx.review.upsert({
        where: {
          productId_userId: {
            productId,
            userId: authUser.userId,
          },
        },
        create: {
          productId,
          userId: authUser.userId,
          orderItemId: validOrderItem.id,
          rating: data.rating,
          comment: data.comment,
        },
        update: {
          rating: data.rating,
          comment: data.comment,
          orderItemId: validOrderItem.id, // Update just in case
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      // 4. Update Vendor Rating
      // First, get all reviews for all products of this vendor to recalculate
      const aggregate = await tx.review.aggregate({
        where: { product: { vendorId: product.vendorId } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.vendor.update({
        where: { id: product.vendorId },
        data: {
          avgRating: aggregate._avg.rating || null,
          reviewsCount: aggregate._count.rating || 0,
        },
      });

      return savedReview;
    });

    return successResponse(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await ctx.params;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    // calculate average rating
    const aggregations = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    return successResponse({
      reviews,
      averageRating: aggregations._avg.rating || 0,
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
