import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

// GET — عرض التسويات المالية الخاصة بالبائع
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("المتجر غير موجود", 404);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "pending" | "paid"
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    let pendingSubOrders: any[] = [];
    let paidPayouts: any[] = [];

    // Pending: sub_orders that are 'delivered' and have no payout
    if (!status || status === "pending") {
      pendingSubOrders = await prisma.subOrder.findMany({
        where: {
          vendorId: vendor.id,
          status: "delivered",
          payout: null, // No payout yet
          deliveryJob: { is: { status: "delivered", deliveredAt: { lte: threeDaysAgo } } },
          order: { payments: { some: { status: "succeeded" } } },
        },
        select: {
          id: true,
          order: { select: { orderNumber: true } },
          subtotal: true,
          commissionAmount: true,
          vendorPayoutAmount: true,
          updatedAt: true, // timestamp of delivery
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    // Paid: payouts from the payouts table
    if (!status || status === "paid") {
      paidPayouts = await prisma.payout.findMany({
        where: {
          vendorId: vendor.id,
          status: "paid",
        },
        select: {
          id: true,
          amount: true,
          status: true,
          paidAt: true,
          subOrder: {
            select: {
              id: true,
              order: { select: { orderNumber: true } },
            },
          },
        },
        orderBy: { paidAt: "desc" },
      });
    }

    // احصائيات سريعة
    let pendingBalance = 0;
    let totalPaid = 0;

    pendingSubOrders.forEach(so => {
      pendingBalance += Number(so.vendorPayoutAmount);
    });

    paidPayouts.forEach(po => {
      totalPaid += Number(po.amount);
    });

    return successResponse({
      stats: { pendingBalance, totalPaid },
      payouts: {
        pending: pendingSubOrders,
        paid: paidPayouts,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — طلب سحب الرصيد المتاح للبائع
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true },
    });

    if (!vendor) {
      return errorResponse("المتجر غير موجود", 404);
    }

    // Find all delivered suborders that do not have a payout yet
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const pendingSubOrders = await prisma.subOrder.findMany({
      where: {
        vendorId: vendor.id,
        status: "delivered",
        payout: null,
        deliveryJob: { is: { status: "delivered", deliveredAt: { lte: threeDaysAgo } } },
        order: { payments: { some: { status: "succeeded" } } },
      },
      select: {
        id: true,
        vendorPayoutAmount: true,
      },
    });

    if (pendingSubOrders.length === 0) {
      return errorResponse("لا يوجد رصيد متاح للسحب حالياً", 400);
    }

    // Create a Payout for each pending suborder
    const createdPayouts = await prisma.$transaction(
      pendingSubOrders.map(so => 
        prisma.payout.create({
          data: {
            vendorId: vendor.id,
            subOrderId: so.id,
            amount: so.vendorPayoutAmount,
            status: "pending",
          }
        })
      )
    );

    return successResponse({
      message: "تم تقديم طلب السحب بنجاح",
      count: createdPayouts.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
