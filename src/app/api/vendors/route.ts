import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where = {
      status: "approved" as const,
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
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
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return successResponse({
      vendors,
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
