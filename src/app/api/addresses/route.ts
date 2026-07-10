import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

const addressSchema = z.object({
  label: z.string().min(1, "اسم العنوان مطلوب"),
  fullName: z.string().min(2, "الاسم بالكامل مطلوب"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  governorate: z.string().min(2, "المحافظة مطلوبة"),
  city: z.string().min(2, "المدينة مطلوبة"),
  streetAddress: z.string().min(5, "العنوان التفصيلي مطلوب"),
  buildingApartment: z.string().optional(),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const addresses = await prisma.userAddress.findMany({
      where: { userId: authUser.userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ],
    });

    return successResponse(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const data = addressSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // If this is set to default, unset all others
      if (data.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: authUser.userId },
          data: { isDefault: false },
        });
      } else {
        // If it's the first address, make it default automatically
        const count = await tx.userAddress.count({ where: { userId: authUser.userId } });
        if (count === 0) {
          data.isDefault = true;
        }
      }

      return tx.userAddress.create({
        data: {
          ...data,
          userId: authUser.userId,
        },
      });
    });

    return successResponse({ message: "تمت إضافة العنوان بنجاح", address: result }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
