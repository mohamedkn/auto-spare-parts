import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

const toggleWishlistSchema = z.object({
  productId: z.string().uuid("رقم المنتج غير صحيح"),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: authUser.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stockQuantity: true,
            status: true,
            images: {
              select: { url: true },
              orderBy: { position: "asc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(wishlist);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const data = toggleWishlistSchema.parse(body);

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: authUser.userId,
          productId: data.productId,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return successResponse({ message: "تمت إزالة المنتج من المفضلة", isWishlisted: false });
    } else {
      // Add to wishlist
      const product = await prisma.product.findUnique({ where: { id: data.productId } });
      if (!product) {
        return errorResponse("المنتج غير موجود", 404);
      }

      await prisma.wishlistItem.create({
        data: {
          userId: authUser.userId,
          productId: data.productId,
        },
      });
      return successResponse({ message: "تم إضافة المنتج للمفضلة", isWishlisted: true }, 201);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
