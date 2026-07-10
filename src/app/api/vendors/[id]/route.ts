import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const vendorId = resolvedParams.id;

    if (!vendorId) {
      return errorResponse("Vendor ID is required", 400);
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
        status: "approved",
      },
      select: {
        id: true,
        storeName: true,
        slug: true,
        logoUrl: true,
        description: true,
        avgRating: true,
        reviewsCount: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      return errorResponse("Vendor not found", 404);
    }

    return successResponse({ vendor });
  } catch (error) {
    return handleApiError(error);
  }
}
