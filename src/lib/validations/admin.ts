/**
 * Zod Validation Schemas — Admin Module
 * ───────────────────────────────────────
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// تحديث حالة المتجر (Vendor)
// ─────────────────────────────────────────────

export const updateVendorStatusSchema = z.object({
  status: z.enum(["approved", "suspended", "pending"]),
  // لو فيه سبب للإيقاف ممكن يتضاف هنا مستقبلاً
});

export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>;

// ─────────────────────────────────────────────
// تأكيد/رفض المدفوعات اليدوية (InstaPay)
// ─────────────────────────────────────────────

export const verifyPaymentSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(), // سبب الرفض أو ملاحظات
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// ─────────────────────────────────────────────
// تسوية مالية (Payout)
// ─────────────────────────────────────────────

export const processPayoutSchema = z.object({
  subOrderIds: z.array(z.string().uuid()).min(1, "لازم تختار طلب واحد على الأقل"),
  bankReference: z.string().trim().min(3, "مرجع التحويل مطلوب").max(100),
});

export type ProcessPayoutInput = z.infer<typeof processPayoutSchema>;

// ─────────────────────────────────────────────
// المرتجعات (Refunds)
// ─────────────────────────────────────────────

export const createRefundSchema = z.object({
  orderItemId: z.string().uuid("رقم العنصر غير صحيح"),
  paymentId: z.string().uuid("رقم الدفع غير صحيح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  reason: z.string().min(5, "سبب الاسترجاع قصير جداً"),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
