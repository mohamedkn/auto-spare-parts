/**
 * POST /api/auth/register
 * ─────────────────────────────────────
 * تسجيل مستخدم جديد (Customer أو Vendor).
 *
 * - Customer: ينشئ user بدور customer فقط.
 * - Vendor: ينشئ user بدور vendor + سجل vendor بحالة 'pending'
 *   (القسم 7.5: owner_id UNIQUE — متجر واحد لكل يوزر).
 * - Admin: لا يُسجّل من الـ API — يُنشأ يدويًا أو بالـ seed.
 *
 * Body (customer): { name, email, password, phone?, role: "customer" }
 * Body (vendor):   { name, email, password, phone?, role: "vendor", storeName, storeDescription? }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import {
  registerCustomerSchema,
  registerVendorSchema,
  registerDriverSchema,
} from "@/lib/validations/auth";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { cookies } from "next/headers";

// Schema لتحديد نوع التسجيل
const roleDiscriminator = z.object({
  role: z.enum(["customer", "vendor", "driver"]),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip, 5, 60000)) {
      return errorResponse("محاولات كثيرة جداً، يرجى المحاولة بعد قليل", 429);
    }

    const body = await request.json();

    // حدد النوع: customer أو vendor
    const { role } = roleDiscriminator.parse(body);

    if (role === "customer") {
      return await registerCustomer(body);
    } else if (role === "vendor") {
      return await registerVendor(body);
    } else {
      return await registerDriver(body);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────
// تسجيل Customer
// ─────────────────────────────────────
async function registerCustomer(body: unknown) {
  const data = registerCustomerSchema.parse(body);

  // تحقق من عدم وجود إيميل مكرر
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    return errorResponse("الإيميل ده مسجّل بالفعل", 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: "customer",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = await signToken({ userId: user.id, role: user.role });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return successResponse({ user, token }, 201);
}

// ─────────────────────────────────────
// تسجيل Vendor
// ─────────────────────────────────────
async function registerVendor(body: unknown) {
  const data = registerVendorSchema.parse(body);

  // تحقق من عدم وجود إيميل مكرر
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    return errorResponse("الإيميل ده مسجّل بالفعل", 409);
  }

  const passwordHash = await hashPassword(data.password);

  // إنشاء slug من اسم المتجر
  const slug = data.storeName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")    // شيل الحروف الخاصة
    .replace(/[\s_]+/g, "-")     // استبدل المسافات بـ -
    .replace(/-+/g, "-")         // شيل الـ - المتكرر
    .replace(/^-|-$/g, "");      // شيل الـ - من الأول والآخر

  // تحقق من عدم وجود slug مكرر للمتجر
  const existingVendor = await prisma.vendor.findUnique({
    where: { slug },
  });
  if (existingVendor) {
    return errorResponse("اسم المتجر ده (slug) موجود بالفعل — اختار اسم تاني", 409);
  }

  // Transaction: ينشئ الـ user والـ vendor مع بعض (أو يفشل الكل)
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: "vendor",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const vendor = await tx.vendor.create({
      data: {
        ownerId: user.id,
        storeName: data.storeName,
        slug,
        description: data.storeDescription,
        status: "pending", // لازم الأدمن يوافق
        bankAccount: data.bankAccount,
        instapayHandle: data.instapayHandle,
        walletPhone: data.walletPhone,
      },
      select: {
        id: true,
        storeName: true,
        slug: true,
        status: true,
      },
    });

    return { user, vendor };
  });

  const token = await signToken({
    userId: result.user.id,
    role: result.user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return successResponse(
    { user: result.user, vendor: result.vendor, token },
    201
  );
}

// ─────────────────────────────────────
// تسجيل Driver
// ─────────────────────────────────────
async function registerDriver(body: unknown) {
  const data = registerDriverSchema.parse(body);

  // تحقق من عدم وجود إيميل مكرر
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    return errorResponse("الإيميل ده مسجّل بالفعل", 409);
  }

  const passwordHash = await hashPassword(data.password);

  // Transaction: ينشئ الـ user والـ driver مع بعض
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: "driver",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const driver = await tx.deliveryDriver.create({
      data: {
        userId: user.id,
        vehicleType: data.vehicleType,
        maxWeightCapacityKg: data.maxWeightCapacityKg,
        status: "offline",
        isVerified: false,
      },
      select: {
        id: true,
        vehicleType: true,
        isVerified: true,
        status: true,
      },
    });

    return { user, driver };
  });

  const token = await signToken({
    userId: result.user.id,
    role: result.user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return successResponse(
    { user: result.user, driver: result.driver, token },
    201
  );
}
