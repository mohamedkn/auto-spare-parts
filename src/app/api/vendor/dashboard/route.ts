import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId },
      select: { id: true, status: true },
    });

    if (!vendor) {
      return errorResponse("مفيش متجر مرتبط بالحساب ده", 404);
    }

    // Basic Stats
    const [productsCount, ordersCount, pendingOrdersCount] = await Promise.all([
      prisma.product.count({ where: { vendorId: vendor.id } }),
      prisma.subOrder.count({ where: { vendorId: vendor.id } }),
      prisma.subOrder.count({ where: { vendorId: vendor.id, status: "pending" } }),
    ]);

    // Earnings: use the same eligibility rules as the payout endpoint so the
    // displayed balance is exactly what can be requested.
    const payoutEligibilityDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const paidPayouts = await prisma.payout.aggregate({
      where: { vendorId: vendor.id, status: "paid" },
      _sum: { amount: true },
    });

    const earned = await prisma.subOrder.aggregate({
      where: {
        vendorId: vendor.id,
        status: "delivered",
        deliveryJob: { is: { status: "delivered" } },
        order: { payments: { some: { status: "succeeded" } } },
      },
      _sum: { vendorPayoutAmount: true, subtotal: true },
      _count: { id: true },
    });

    const pendingBalanceQuery = await prisma.subOrder.aggregate({
      where: {
        vendorId: vendor.id,
        status: "delivered",
        payout: null,
        deliveryJob: { is: { status: "delivered", deliveredAt: { lte: payoutEligibilityDate } } },
        order: { payments: { some: { status: "succeeded" } } },
      },
      _sum: { vendorPayoutAmount: true },
    });

    const pendingBalance = Number(pendingBalanceQuery._sum.vendorPayoutAmount || 0);
    const totalRevenue = Number(earned._sum.vendorPayoutAmount || 0);
    const totalPaid = Number(paidPayouts._sum.amount || 0);
    const aov = earned._count.id > 0 ? (Number(earned._sum.subtotal || 0) / earned._count.id).toFixed(0) : 0;

    // Recent Orders (Last 5)
    const recentOrders = await prisma.subOrder.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        order: { select: { user: { select: { name: true } }, orderNumber: true } }
      }
    });

    // Top Products
    const topProductsQuery = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        subOrder: {
          vendorId: vendor.id,
          status: "delivered",
          order: { payments: { some: { status: "succeeded" } } },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductIds = topProductsQuery.map(p => p.productId);
    const topProductsData = topProductIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, images: { take: 1 } }
    }) : [];

    const topProducts = topProductsQuery.map(p => ({
      ...topProductsData.find(pd => pd.id === p.productId),
      totalSold: p._sum.quantity
    })).filter(p => p.id);

    // Chart Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days including today

    const salesData = await prisma.subOrder.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: sevenDaysAgo },
        status: "delivered",
        deliveryJob: { is: { status: "delivered" } },
        order: { payments: { some: { status: "succeeded" } } },
      },
      select: { createdAt: true, subtotal: true },
    });

    const salesMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesMap.set(dateStr, 0);
    }

    salesData.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      if (salesMap.has(dateStr)) {
        salesMap.set(dateStr, salesMap.get(dateStr) + Number(sale.subtotal));
      }
    });

    const chartData = Array.from(salesMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return successResponse({
      vendorStatus: vendor.status,
      metrics: {
        totalRevenue,
        ordersCount,
        pendingOrdersCount,
        productsCount,
        aov,
        pendingBalance,
        totalPaid,
      },
      chartData,
      recentOrders,
      topProducts
    });

  } catch (error) {
    return handleApiError(error);
  }
}
