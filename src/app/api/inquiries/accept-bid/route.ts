import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { acceptBidSchema } from "@/lib/validations/inquiry";
import { appendSlugSuffix, generateSlug } from "@/lib/utils/slug";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, "customer");
    const { bidId } = acceptBidSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: { inquiry: true, vendor: { select: { id: true } } },
      });
      if (!bid || bid.inquiry.userId !== user.userId) throw new Error("BID_NOT_FOUND");
      const now = new Date();
      if (bid.inquiry.status === "open" && bid.inquiry.biddingEndsAt && bid.inquiry.biddingEndsAt > now) throw new Error("BIDDING_STILL_OPEN");
      if (bid.status !== "active" || !["open", "bidding_closed"].includes(bid.inquiry.status)) throw new Error("BID_UNAVAILABLE");

      const claimed = await tx.inquiry.updateMany({
        where: { id: bid.inquiryId, acceptedBidId: null, status: { in: ["open", "bidding_closed"] } },
        data: { acceptedBidId: bid.id, status: "accepted" },
      });
      if (claimed.count !== 1) throw new Error("BID_UNAVAILABLE");

      const parsed = (bid.inquiry.aiParsedData || {}) as { partName?: string; oemNumber?: string | null };
      const productName = parsed.partName || bid.inquiry.description.slice(0, 200);
      let slug = generateSlug(`${productName}-${bid.id.slice(0, 8)}`);
      const duplicateSlug = await tx.product.findUnique({ where: { vendorId_slug: { vendorId: bid.vendor.id, slug } }, select: { id: true } });
      if (duplicateSlug) slug = appendSlugSuffix(slug);
      const product = await tx.product.create({
        data: { vendorId: bid.vendor.id, categoryId: bid.inquiry.categoryId, name: productName, slug, description: bid.notes || bid.inquiry.description, oemNumber: parsed.oemNumber || null, price: bid.price, stockQuantity: 1, condition: bid.condition, status: "active", isPrivate: true },
      });
      await tx.bid.update({ where: { id: bid.id }, data: { status: "accepted", productId: product.id } });
      await tx.bid.updateMany({ where: { inquiryId: bid.inquiryId, id: { not: bid.id }, status: "active" }, data: { status: "rejected" } });
      const cart = await tx.cart.upsert({ where: { userId: user.userId }, create: { userId: user.userId }, update: {} });
      const item = await tx.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
      return { inquiryId: bid.inquiryId, bidId: bid.id, cartItemId: item.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "BID_NOT_FOUND") return errorResponse("العرض غير موجود", 404);
    if (error instanceof Error && error.message === "BIDDING_STILL_OPEN") return errorResponse("انتظر انتهاء مهلة التجار البالغة 5 دقائق قبل اختيار العرض", 409);
    if (error instanceof Error && error.message === "BID_UNAVAILABLE") return errorResponse("تم قبول عرض آخر أو لم يعد العرض متاحًا", 409);
    return handleApiError(error);
  }
}
