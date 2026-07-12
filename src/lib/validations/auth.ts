/**
 * Zod Validation Schemas — Auth Module
 * ─────────────────────────────────────
 * كل input بيدخل الـ API لازم يعدّي من هنا الأول.
 */

import { z } from "zod";
import { VEHICLE_MARKET_VALUES } from "@/lib/vehicles/markets";

// ─────────────────────────────────────────────
// Register — Customer
// ─────────────────────────────────────────────

export const registerCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم لازم يكون حرفين على الأقل")
    .max(150, "الاسم طويل أوي"),
  email: z
    .string()
    .email("إيميل غير صالح")
    .max(150)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "كلمة السر لازم تكون 8 حروف على الأقل")
    .max(100),
  phone: z.string().max(20).optional(),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

// ─────────────────────────────────────────────
// Register — Vendor
// ─────────────────────────────────────────────
// الـ Vendor بيسجّل ببيانات اليوزر + بيانات المتجر مع بعض.
// المتجر بيتعمله status = 'pending' لحد ما الأدمن يوافق.

export const registerVendorSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم لازم يكون حرفين على الأقل")
    .max(150),
  email: z
    .string()
    .email("إيميل غير صالح")
    .max(150)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "كلمة السر لازم تكون 8 حروف على الأقل")
    .max(100),
  phone: z.string().max(20).optional(),
  storeName: z
    .string()
    .min(2, "اسم المتجر لازم يكون حرفين على الأقل")
    .max(150),
  storeDescription: z.string().max(2000).optional(),
  bankAccount: z.string().min(1, "رقم الحساب البنكي مطلوب").max(150),
  instapayHandle: z.string().max(100).optional(),
  walletPhone: z.string().max(20).optional(),
  specialties: z.array(z.enum(VEHICLE_MARKET_VALUES)).min(1, "اختر تخصصًا واحدًا على الأقل").max(VEHICLE_MARKET_VALUES.length),
});

export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .email("إيميل غير صالح")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "كلمة السر مطلوبة"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Register — Driver
// ─────────────────────────────────────────────

export const registerDriverSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم لازم يكون حرفين على الأقل")
    .max(150),
  email: z
    .string()
    .email("إيميل غير صالح")
    .max(150)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "كلمة السر لازم تكون 8 حروف على الأقل")
    .max(100),
  phone: z.string().max(20).optional(),
  vehicleType: z.string().min(2, "نوع المركبة مطلوب").max(50),
  maxWeightCapacityKg: z.number().optional(),
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;
