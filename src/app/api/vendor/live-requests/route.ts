import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { handleApiError, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, "vendor");
    const vendor = await prisma.vendor.findUnique({ where: { ownerId: user.userId }, select: { id: true, status: true, specialties: true } });
    if (!vendor || vendor.status !== "approved") return successResponse({ requests: [], serverTime: new Date().toISOString() });

    const now = new Date();
    await prisma.inquiry.updateMany({ where: { status: "open", biddingEndsAt: { lte: now } }, data: { status: "bidding_closed" } });
    const requests = await prisma.inquiry.findMany({
      where: {
        status: "open",
        biddingEndsAt: { gt: now },
        ...(vendor.specialties.length > 0 ? { OR: [{ vehicleMarkets: { isEmpty: true } }, { vehicleMarkets: { hasSome: vendor.specialties } }] } : {}),
      },
      include: { category: { select: { name: true } }, bids: { where: { vendorId: vendor.id }, select: { id: true, price: true, condition: true, notes: true } } },
      orderBy: { biddingEndsAt: "asc" },
      take: 50,
    });
    return successResponse({ requests, serverTime: now.toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}
