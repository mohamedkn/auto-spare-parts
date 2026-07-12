import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { handleApiError, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "admin");
    const inquiries = await prisma.inquiry.findMany({
      include: { user: { select: { name: true, phone: true } }, category: { select: { name: true } }, _count: { select: { bids: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return successResponse({ inquiries });
  } catch (error) {
    return handleApiError(error);
  }
}
