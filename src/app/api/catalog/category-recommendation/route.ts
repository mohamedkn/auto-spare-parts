import { NextRequest } from "next/server";

import { successResponse, handleApiError } from "@/lib/api-response";
import { recommendCategorySlug } from "@/lib/catalog/egypt-auto-parts";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (query.length < 2) return successResponse({ recommendation: null });

    const recommendedSlug = recommendCategorySlug(query);
    if (!recommendedSlug) return successResponse({ recommendation: null });

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: recommendedSlug },
          ...(recommendedSlug === "oils-fluids" ? [{ slug: "oils-and-fluids" }] : []),
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    return successResponse({ recommendation: category });
  } catch (error) {
    return handleApiError(error);
  }
}
