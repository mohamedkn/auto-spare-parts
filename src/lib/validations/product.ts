/**
 * Zod Validation Schemas — Products Module
 * ─────────────────────────────────────────
 */

import { z } from "zod";

const allowedImageHosts = new Set(["images.unsplash.com", "res.cloudinary.com"]);
const productImageUrlSchema = z.string().url("رابط الصورة غير صالح").max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedImageHosts.has(url.hostname);
  } catch {
    return false;
  }
}, "يجب رفع الصورة على Cloudinary أو استخدام رابط Unsplash موثوق");

// ─────────────────────────────────────────────
// إنشاء منتج جديد
// ─────────────────────────────────────────────

const createProductBaseSchema = z.object({
  name: z
    .string()
    .min(2, "اسم المنتج لازم يكون حرفين على الأقل")
    .max(200),
  description: z.string().max(5000).optional(),
  price: z
    .number()
    .positive("السعر لازم يكون أكبر من صفر")
    .max(999999.99, "السعر كبير أوي"),
  stockQuantity: z
    .number()
    .int("الكمية لازم تكون رقم صحيح")
    .min(0, "الكمية مينفعش تكون سالبة"),
  categoryId: z.string().uuid("ID الفئة غير صالح").optional(),
  status: z.enum(["active", "draft"]).default("active"),
  oemNumber: z.string().max(100).optional().nullable(),
  partNumber: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  condition: z.enum(["new_original", "new_aftermarket", "used", "refurbished"]).default("new_original"),
  placement: z.string().max(50).optional().nullable(),
  compatibilities: z
    .array(
      z.object({
        vehicleModelId: z.string().uuid("ID موديل السيارة غير صالح"),
        specificYear: z.number().int().min(1900).max(2100).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: productImageUrlSchema,
        position: z.number().int().min(0).default(0),
      })
    )
    .max(10, "أقصى عدد صور 10")
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(150),
        sku: z.string().max(100).optional(),
        price: z.number().positive().max(999999.99).optional(),
        stockQuantity: z.number().int().min(0).default(0),
      })
    )
    .max(50, "أقصى عدد خيارات 50")
    .optional(),
});

export const createProductSchema = createProductBaseSchema.refine(
  (data) => Boolean(data.categoryId),
  { path: ["categoryId"], message: "يجب اختيار تصنيف للمنتج" },
);

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ─────────────────────────────────────────────
// تعديل منتج — كل الحقول اختيارية
// ─────────────────────────────────────────────

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "اسم المنتج لازم يكون حرفين على الأقل")
    .max(200)
    .optional(),
  description: z.string().max(5000).optional().nullable(),
  price: z
    .number()
    .positive("السعر لازم يكون أكبر من صفر")
    .max(999999.99)
    .optional(),
  stockQuantity: z
    .number()
    .int("الكمية لازم تكون رقم صحيح")
    .min(0, "الكمية مينفعش تكون سالبة")
    .optional(),
  categoryId: z.string().uuid("ID الفئة غير صالح").optional().nullable(),
  status: z.enum(["active", "draft", "out_of_stock"]).optional(),
  oemNumber: z.string().max(100).optional().nullable(),
  partNumber: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  condition: z.enum(["new_original", "new_aftermarket", "used", "refurbished"]).optional(),
  placement: z.string().max(50).optional().nullable(),
  compatibilities: z
    .array(
      z.object({
        vehicleModelId: z.string().uuid("ID موديل السيارة غير صالح"),
        specificYear: z.number().int().min(1900).max(2100).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: productImageUrlSchema,
        position: z.number().int().min(0).default(0),
      })
    )
    .max(10, "أقصى عدد صور 10")
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // For updating existing variants
        name: z.string().min(1).max(150),
        sku: z.string().max(100).optional(),
        price: z.number().positive().max(999999.99).optional(),
        stockQuantity: z.number().int().min(0).default(0),
      })
    )
    .max(50, "أقصى عدد خيارات 50")
    .optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─────────────────────────────────────────────
// Query params للتصفح والبحث (عامة)
// ─────────────────────────────────────────────

export const productQuerySchema = z.object({
  search: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  oemNumber: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  condition: z.enum(["new_original", "new_aftermarket", "used", "refurbished"]).optional(),
  vehicleMakeId: z.string().uuid().optional(),
  vehicleModelId: z.string().uuid().optional(),
  year: z.coerce.number().int().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(), // 🆕 Phase 2.5
  inStock: z.enum(["true", "false"]).optional(), // 🆕 Phase 2.5
  status: z.enum(["active", "draft", "out_of_stock"]).optional(),
  sortBy: z
    .enum(["relevance", "price_asc", "price_desc", "newest", "oldest", "rating_desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
