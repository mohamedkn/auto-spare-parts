import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "driver");

    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
      select: { 
        id: true,
        walletBalance: true,
        cashOnHandBalance: true,
        cashLimit: true
      },
    });

    if (!driver) {
      return errorResponse("حساب السائق غير موجود", 404);
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        walletOwnerType: "driver",
        walletOwnerId: driver.id
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to recent 50 for performance
    });

    return successResponse({
      balances: {
        walletBalance: driver.walletBalance,
        cashOnHandBalance: driver.cashOnHandBalance,
        cashLimit: driver.cashLimit
      },
      transactions
    });
  } catch (error) {
    return handleApiError(error);
  }
}
