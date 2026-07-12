import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { createInquirySchema } from "@/lib/validations/inquiry";
import { parseInquiry } from "@/lib/inquiries/ai";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, "customer");
    const data = createInquirySchema.parse(await request.json());
    const category = data.categoryId ? await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }) : null;
    if (data.categoryId && !category) return errorResponse("التصنيف غير موجود", 422);

    let parsedData;
    try {
      parsedData = await parseInquiry(data.description, data.vin);
    } catch (error) {
      console.error("Inquiry AI analysis failed:", error);
      parsedData = { partName: data.description.slice(0, 200), weightClass: "medium", confidence: 0 };
    }

    const inquiry = await prisma.inquiry.create({
      data: { userId: user.userId, categoryId: data.categoryId, description: data.description, imageUrl: data.imageUrl, vin: data.vin, vehicleMarkets: data.vehicleMarkets, aiParsedData: parsedData },
    });
    return successResponse(inquiry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, "customer");
    const now = new Date();
    await prisma.inquiry.updateMany({ where: { userId: user.userId, status: "open", biddingEndsAt: { lte: now } }, data: { status: "bidding_closed" } });
    const inquiries = await prisma.inquiry.findMany({
      where: { userId: user.userId },
      include: {
        category: { select: { id: true, name: true } },
        bids: {
          where: { status: { in: ["active", "accepted"] } },
          select: { id: true, price: true, condition: true, notes: true, status: true, createdAt: true, vendor: { select: { storeName: true, avgRating: true, reviewsCount: true } } },
          orderBy: { price: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse({ inquiries });
  } catch (error) {
    return handleApiError(error);
  }
}
