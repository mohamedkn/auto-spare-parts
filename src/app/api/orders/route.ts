import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const orders = await prisma.order.findMany({
      where: { userId: authUser.userId, subOrders: { some: {} } },
      include: {
        subOrders: {
          include: {
            vendor: { select: { storeName: true } },
            deliveryJob: {
              include: {
                driver: {
                  select: { user: { select: { name: true, phone: true } } }
                }
              }
            },
            items: {
              include: {
                product: {
                  select: { name: true, images: { select: { url: true }, take: 1 } },
                },
              },
            },
          },
        },
        payments: {
          select: { status: true, amount: true, provider: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ordersWithPricing = orders.map((order) => {
      const itemsSubtotal = order.subOrders.reduce(
        (total, subOrder) => total + Number(subOrder.subtotal),
        0
      );
      const total = Number(order.totalAmount);

      return {
        ...order,
        pricing: {
          itemsSubtotal,
          deliveryFee: Math.max(0, total - itemsSubtotal),
          total,
        },
      };
    });

    return successResponse(ordersWithPricing);
  } catch (error) {
    return handleApiError(error);
  }
}
