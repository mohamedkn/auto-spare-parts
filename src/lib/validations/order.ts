/**
 * Zod Validation Schemas — Vendor Orders Module
 * ───────────────────────────────────────────────
 */

import { z } from "zod";

// حالات الطلب الفرعي المتاحة للـ Vendor
// (لا يمكنه إرجاعها لـ pending، فهذه حالة ابتدائية)
export const updateSubOrderStatusSchema = z.object({
  status: z.enum([
    "preparing",
    "processing",
    "cancelled",
  ]),
});

export type UpdateSubOrderStatusInput = z.infer<
  typeof updateSubOrderStatusSchema
>;
