import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { createBidSchema } from "@/lib/validations/inquiry";
import { isBiddingOpen } from "@/lib/inquiries/constants";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, "vendor");
    const data = createBidSchema.parse(await request.json());
    const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.userId }, select: { id: true, status: true } });
    if (!vendor || vendor.status !== "approved") return errorResponse("المتجر غير معتمد لتقديم عروض", 403);
    const inquiry = await prisma.inquiry.findUnique({ where: { id: data.inquiryId }, select: { status: true, biddingEndsAt: true } });
    if (!inquiry || !isBiddingOpen(inquiry.status, inquiry.biddingEndsAt)) return errorResponse("انتهت مهلة التسعير لهذا الطلب", 409);

    const bid = await prisma.bid.upsert({
      where: { inquiryId_vendorId: { inquiryId: data.inquiryId, vendorId: vendor.id } },
      create: { inquiryId: data.inquiryId, vendorId: vendor.id, price: data.price, condition: data.condition, notes: data.notes },
      update: { price: data.price, condition: data.condition, notes: data.notes, status: "active" },
    });
    return successResponse(bid, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
