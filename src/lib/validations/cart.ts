/**
 * Zod Validation Schemas — Cart & Checkout Module
 * ─────────────────────────────────────────────────
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// إضافة عنصر للسلة
// ─────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().uuid("ID المنتج غير صالح"),
  variantId: z.string().uuid("ID المتغير غير صالح").optional().nullable(),
  quantity: z
    .number()
    .int("الكمية لازم تكون رقم صحيح")
    .min(1, "الكمية لازم تكون 1 على الأقل"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

// ─────────────────────────────────────────────
// تعديل كمية عنصر في السلة
// ─────────────────────────────────────────────

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("الكمية لازم تكون رقم صحيح")
    .min(1, "الكمية لازم تكون 1 على الأقل"),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// ─────────────────────────────────────────────
// عنوان الشحن (JSONB في جدول orders)
// ─────────────────────────────────────────────

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب").max(150),
  phone: z.string().min(8, "رقم التليفون مطلوب").max(20),
  addressLine1: z.string().min(5, "العنوان مطلوب").max(300),
  addressLine2: z.string().max(300).optional(),
  city: z.string().min(2, "المدينة مطلوبة").max(100),
  governorate: z.string().min(2, "المحافظة مطلوبة").max(100),
  postalCode: z.string().max(10).optional(),
});

// ─────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────

export const checkoutSchema = z.object({
  addressId: z.string().uuid("رقم العنوان غير صحيح").optional(), // 🆕 Phase 2.5
  shippingAddress: shippingAddressSchema.optional(), // جعلناها اختيارية لو فيه addressId
  paymentMethod: z
    .enum(["cash_on_delivery", "paymob", "instapay"])
    .default("cash_on_delivery"),
}).refine(data => data.addressId || data.shippingAddress, {
  message: "يجب تقديم عنوان الشحن أو رقم عنوان محفوظ",
  path: ["shippingAddress"],
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
