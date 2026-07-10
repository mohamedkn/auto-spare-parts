import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { processPayoutSchema } from "@/lib/validations/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

// GET — عرض الطلبات الفرعية المستحقة الدفع للمتاجر
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "admin");

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    // Eligibility check:
    // 1. sub_order.status = 'delivered'
    // 2. payment.status = 'succeeded'
    // 3. 3 days have passed since delivery
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      status: "delivered",
      payout: null, // No payout exists yet
      deliveryJob: { is: { status: "delivered", deliveredAt: { lte: threeDaysAgo } } },
      order: {
        payments: {
          some: { status: "succeeded" },
        },
      },
    };

    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    const pendingPayouts = await prisma.subOrder.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: { id: true, storeName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Grouping by vendor to make it easier for admin
    const groupedByVendor = pendingPayouts.reduce((acc, subOrder) => {
      const vId = subOrder.vendorId;
      if (!acc[vId]) {
        acc[vId] = {
          vendorId: vId,
          storeName: subOrder.vendor.storeName,
          totalPayoutDue: 0,
          subOrders: [],
        };
      }
      acc[vId].totalPayoutDue += Number(subOrder.vendorPayoutAmount);
      acc[vId].subOrders.push({
        id: subOrder.id,
        subtotal: subOrder.subtotal,
        commissionAmount: subOrder.commissionAmount,
        vendorPayoutAmount: subOrder.vendorPayoutAmount,
        deliveredAt: subOrder.updatedAt,
      });
      return acc;
    }, {} as Record<string, any>);

    return successResponse({
      vendors: Object.values(groupedByVendor),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — معالجة الدفع اليدوي لطلبات معينة
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "admin");

    const body = await request.json();
    const data = processPayoutSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify all suborders are eligible
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const subOrders = await tx.subOrder.findMany({
        where: {
          id: { in: data.subOrderIds },
        },
        include: {
          payout: true,
          deliveryJob: true,
          order: {
            include: {
              payments: { where: { status: "succeeded" } },
            },
          },
        },
      });

      if (subOrders.length !== data.subOrderIds.length) {
        throw new Error("بعض الطلبات غير موجودة");
      }

      for (const so of subOrders) {
        if (so.status !== "delivered") {
          throw new Error(`الطلب ${so.id} لم يتم توصيله بعد`);
        }
        if (so.order.payments.length === 0) {
          throw new Error(`الطلب ${so.id} لم يتم تحصيل قيمته بعد`);
        }
        if (!so.deliveryJob?.deliveredAt || so.deliveryJob.deliveredAt > threeDaysAgo) {
          throw new Error(`الطلب ${so.id} لم يمر عليه 3 أيام منذ التوصيل`);
        }
        if (so.payout) {
          throw new Error(`الطلب ${so.id} تمت تسويته مسبقاً (Payout ID: ${so.payout.id})`);
        }
      }

      // 2. Create payouts
      const createdPayouts = await Promise.all(
        subOrders.map((so) =>
          tx.payout.create({
            data: {
              vendorId: so.vendorId,
              subOrderId: so.id,
              amount: so.vendorPayoutAmount,
              status: "paid",
              paidAt: new Date(),
              bankReference: data.bankReference,
            },
          })
        )
      );

      return createdPayouts;
    });

    return successResponse({
      message: `تم تسوية ${result.length} طلب بنجاح`,
      payouts: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
