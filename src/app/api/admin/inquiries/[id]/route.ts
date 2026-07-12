import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { reviewInquirySchema } from "@/lib/validations/inquiry";
import { getBiddingEndsAt } from "@/lib/inquiries/constants";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, "admin");
    const { id } = await params;
    const data = reviewInquirySchema.parse(await request.json());
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) return errorResponse("طلب التسعير غير موجود", 404);
    if (existing.status !== "under_review") return errorResponse("تمت مراجعة هذا الطلب بالفعل", 409);

    const startsAt = new Date();
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: data.action === "approve"
        ? { status: "open", adminNotes: data.adminNotes, aiParsedData: data.parsedData ?? (existing.aiParsedData === null ? Prisma.JsonNull : existing.aiParsedData as Prisma.InputJsonValue), biddingStartsAt: startsAt, biddingEndsAt: getBiddingEndsAt(startsAt) }
        : { status: "cancelled", adminNotes: data.adminNotes || "رفضه الأدمن" },
    });
    return successResponse(inquiry);
  } catch (error) {
    return handleApiError(error);
  }
}
