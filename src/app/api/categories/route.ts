/**
 * Public Categories API
 * ─────────────────────────────────────
 * GET /api/categories — عرض كل الفئات (عام — بدون auth)
 *
 * بيرجع الفئات مع الفئات الفرعية بتاعتها (شجرة واحدة).
 */

import { prisma } from "@/lib/db";
import { successResponse, handleApiError } from "@/lib/api-response";
import { EGYPT_MARKET_CATEGORIES } from "@/lib/catalog/egypt-auto-parts";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    // جيب كل الفئات الرئيسية (اللي مالهاش parent) مع أولادها
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const priority = new Map(EGYPT_MARKET_CATEGORIES.map((category) => [category.slug, category.priority]));
    const orderedCategories = [...categories].sort(
      (a, b) => (priority.get(b.slug) || 0) - (priority.get(a.slug) || 0) || a.name.localeCompare(b.name, "ar"),
    );

    const response = successResponse(orderedCategories);
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — إضافة فئة جديدة (Admin Only)
import { requireRole } from "@/lib/auth/middleware";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً"),
  slug: z.string().min(2, "الـ Slug قصير جداً"),
  description: z.string().optional(),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional(),
  parentId: z.string().uuid("رابط الفئة الأب غير صحيح").optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "admin");

    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
      },
    });

    return successResponse({
      message: "تم إضافة الفئة بنجاح",
      category,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
