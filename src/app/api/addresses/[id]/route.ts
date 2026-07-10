import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

const addressUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  governorate: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  streetAddress: z.string().min(5).optional(),
  buildingApartment: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(request);
    const { id: addressId } = await props.params;
    const body = await request.json();
    const data = addressUpdateSchema.parse(body);

    const address = await prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== authUser.userId) {
      return errorResponse("العنوان غير موجود", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // If setting to default, unset others
      if (data.isDefault && !address.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: authUser.userId },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data,
      });
    });

    return successResponse({ message: "تم تحديث العنوان", address: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth(request);
    const { id: addressId } = await props.params;

    const address = await prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== authUser.userId) {
      return errorResponse("العنوان غير موجود", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id: addressId } });

      // If it was default, make another one default
      if (address.isDefault) {
        const another = await tx.userAddress.findFirst({
          where: { userId: authUser.userId },
          orderBy: { createdAt: "desc" },
        });
        if (another) {
          await tx.userAddress.update({
            where: { id: another.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return successResponse({ message: "تم حذف العنوان بنجاح" });
  } catch (error) {
    return handleApiError(error);
  }
}
