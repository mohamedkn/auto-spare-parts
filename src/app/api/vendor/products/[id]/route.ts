/**
 * Vendor Single Product API
 * ─────────────────────────────────────
 * PATCH  /api/vendor/products/:id  — تعديل منتج (vendor only, own product)
 * DELETE /api/vendor/products/:id  — حذف منتج (vendor only, own product)
 *
 * ⚠️ الـ vendor يقدر يعدّل/يمسح منتجات متجره بس — مش متجر تاني.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { updateProductSchema } from "@/lib/validations/product";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { generateSlug, appendSlugSuffix } from "@/lib/utils/slug";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// PATCH — تعديل منتج
// ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vendor/products/[id]">
) {
  try {
    const authUser = await requireRole(request, "vendor");
    const { id } = await ctx.params;

    // جيب المتجر بتاع اليوزر
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    // تأكد إن المنتج تابع للمتجر ده (authorization check)
    const existingProduct = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!existingProduct) {
      return errorResponse("المنتج مش موجود أو مش تابع لمتجرك", 404);
    }

    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // لو غيّر الاسم، أنشئ slug جديد
    let slug: string | undefined;
    if (data.name && data.name !== existingProduct.name) {
      slug = generateSlug(data.name);
      // تأكد الـ slug مش مكرر لنفس الـ vendor
      const slugExists = await prisma.product.findFirst({
        where: {
          vendorId: vendor.id,
          slug,
          NOT: { id }, // استثني المنتج الحالي
        },
      });
      if (slugExists) {
        slug = appendSlugSuffix(slug);
      }
    }

    // لو بعت صور جديدة، هنمسح القديمة ونضيف الجديدة
    const product = await prisma.$transaction(async (tx) => {
      // لو فيه صور جديدة، امسح القديمة الأول
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });
      }

      // لو فيه خيارات جديدة، امسح القديمة الأول
      if (data.variants !== undefined) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });
      }

      if (data.compatibilities !== undefined) {
        await tx.productCompatibility.deleteMany({
          where: { productId: id },
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(slug && { slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.price !== undefined && {
            price: new Prisma.Decimal(data.price),
          }),
          ...(data.stockQuantity !== undefined && {
            stockQuantity: data.stockQuantity,
          }),
          ...(data.categoryId !== undefined && {
            categoryId: data.categoryId,
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.images !== undefined && {
            images: {
              create: data.images.map((img) => ({
                url: img.url,
                position: img.position,
              })),
            },
          }),
          ...(data.variants !== undefined && {
            variants: {
              create: data.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: v.price ? new Prisma.Decimal(v.price) : null,
                stockQuantity: v.stockQuantity,
              })),
            },
          }),
          ...(data.compatibilities !== undefined && {
            compatibilities: {
              create: data.compatibilities.map((c) => ({
                vehicleModelId: c.vehicleModelId,
                specificYear: c.specificYear,
                notes: c.notes,
              })),
            },
          }),
        },
        include: {
          images: { orderBy: { position: "asc" } },
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      });
    });

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE — حذف منتج
// ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/vendor/products/[id]">
) {
  try {
    const authUser = await requireRole(request, "vendor");
    const { id } = await ctx.params;

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    // تأكد إن المنتج تابع للمتجر ده
    const existingProduct = await prisma.product.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!existingProduct) {
      return errorResponse("المنتج مش موجود أو مش تابع لمتجرك", 404);
    }

    // الحذف — الـ ON DELETE CASCADE هيمسح الصور تلقائيًا
    // لكن لو فيه order_items مربوطة بالمنتج ده (ON DELETE RESTRICT)
    // هيرمي error — وده السلوك الصح (محافظة على تاريخ الطلبات)
    try {
      await prisma.product.delete({ where: { id } });
      return successResponse({ message: "المنتج اتمسح بنجاح" });
    } catch (deleteError) {
      if (
        deleteError instanceof Error &&
        "code" in deleteError &&
        (deleteError as { code: string }).code === "P2003"
      ) {
        return errorResponse(
          "المنتج ده مرتبط بطلبات سابقة — ممكن تخليه 'draft' بدل ما تمسحه",
          409
        );
      }
      throw deleteError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
