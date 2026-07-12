/**
 * Vendor Products API
 * ─────────────────────────────────────
 * POST /api/vendor/products  — إضافة منتج جديد (vendor only, approved)
 * GET  /api/vendor/products  — عرض منتجات المتجر الخاص بالـ vendor
 *
 * ⚠️ Authorization: الـ vendor يقدر يضيف/يشوف منتجات متجره بس — مش متجر تاني.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { createProductSchema } from "@/lib/validations/product";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { generateSlug, appendSlugSuffix } from "@/lib/utils/slug";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// POST — إنشاء منتج جديد
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    // جيب بيانات المتجر + تأكد إنه approved
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true, status: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    if (vendor.status !== "approved") {
      return errorResponse(
        "المتجر لسه مش معتمد — انتظر موافقة الأدمن قبل ما تضيف منتجات",
        403
      );
    }

    const body = await request.json();
    const data = createProductSchema.parse(body);
    const categoryId = data.categoryId as string;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true, _count: { select: { children: true } } },
    });

    if (!category) {
      return errorResponse("التصنيف المحدد غير موجود", 422);
    }
    if (category._count.children > 0) {
      return errorResponse("اختر تصنيفًا فرعيًا محددًا للقطعة", 422);
    }

    const oemNumber = data.oemNumber?.trim().toUpperCase() || null;
    const partNumber = data.partNumber?.trim().toUpperCase() || null;
    if (oemNumber || partNumber) {
      const duplicate = await prisma.product.findFirst({
        where: {
          vendorId: vendor.id,
          isPrivate: false,
          OR: [
            ...(oemNumber ? [{ oemNumber: { equals: oemNumber, mode: "insensitive" as const } }] : []),
            ...(partNumber ? [{ partNumber: { equals: partNumber, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, name: true },
      });
      if (duplicate) {
        return errorResponse(`هذه القطعة مسجلة بالفعل باسم: ${duplicate.name}`, 409);
      }
    }

    // أنشئ slug من اسم المنتج
    let slug = generateSlug(data.name);

    // تأكد الـ slug مش مكرر لنفس الـ vendor — لو مكرر، ضيف suffix
    const existingSlug = await prisma.product.findUnique({
      where: { vendorId_slug: { vendorId: vendor.id, slug } },
    });
    if (existingSlug) {
      slug = appendSlugSuffix(slug);
    }

    // أنشئ المنتج + الصور (لو فيه) في transaction واحدة
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: data.name,
        slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        stockQuantity: data.stockQuantity,
        categoryId,
        status: data.status,
        oemNumber,
        partNumber,
        brand: data.brand?.trim() || null,
        condition: data.condition,
        placement: data.placement,
        compatibilities: data.compatibilities && data.compatibilities.length > 0
          ? {
              create: data.compatibilities.map((c) => ({
                vehicleModelId: c.vehicleModelId,
                specificYear: c.specificYear,
                notes: c.notes,
              })),
            }
          : undefined,
        images: data.images
          ? {
              create: data.images.map((img) => ({
                url: img.url,
                position: img.position,
              })),
            }
          : undefined,
        variants: data.variants && data.variants.length > 0
          ? {
              create: data.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: v.price ? new Prisma.Decimal(v.price) : null,
                stockQuantity: v.stockQuantity,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return successResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// GET — عرض منتجات المتجر الخاص بالـ vendor
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    // Query params بسيطة للـ vendor dashboard
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") as "active" | "draft" | "out_of_stock" | null;

    const where: Prisma.ProductWhereInput = {
      vendorId: vendor.id,
      isPrivate: false,
      ...(status && { status }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { position: "asc" }, take: 1 }, // أول صورة بس
          category: { select: { id: true, name: true } },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({
      products,
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
