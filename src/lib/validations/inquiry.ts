import { z } from "zod";
import { VEHICLE_MARKET_VALUES } from "@/lib/vehicles/markets";

const optionalHttpsUrl = z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:", "رابط الصورة يجب أن يستخدم HTTPS").optional();

export const createInquirySchema = z.object({
  description: z.string().trim().min(10, "اكتب وصفًا أوضح للقطعة").max(2000),
  imageUrl: optionalHttpsUrl,
  vin: z.string().trim().min(6).max(50).optional(),
  categoryId: z.string().uuid().optional(),
  vehicleMarkets: z.array(z.enum(VEHICLE_MARKET_VALUES)).max(1, "يمكن للعميل اختيار نوع سيارة واحد فقط").default([]),
});

export const reviewInquirySchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().trim().max(1000).optional(),
  parsedData: z.object({
    partName: z.string().trim().min(2).max(200),
    oemNumber: z.string().trim().max(100).nullable().optional(),
    make: z.string().trim().max(100).nullable().optional(),
    model: z.string().trim().max(100).nullable().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 2).nullable().optional(),
    weightClass: z.enum(["light", "medium", "heavy"]),
    confidence: z.number().min(0).max(1),
  }).optional(),
});

export const createBidSchema = z.object({
  inquiryId: z.string().uuid(),
  price: z.coerce.number().positive().max(999999.99),
  condition: z.enum(["new_original", "new_aftermarket", "used", "refurbished"]),
  notes: z.string().trim().max(1000).optional(),
});

export const acceptBidSchema = z.object({ bidId: z.string().uuid() });

export const inquiryAiResultSchema = z.object({
  partName: z.string().trim().min(2).max(200),
  oemNumber: z.string().trim().max(100).nullable().optional(),
  make: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).nullable().optional(),
  weightClass: z.enum(["light", "medium", "heavy"]),
  confidence: z.number().min(0).max(1),
});

export type InquiryAiResult = z.infer<typeof inquiryAiResultSchema>;
