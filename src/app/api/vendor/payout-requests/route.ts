import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "vendor");

    // Fetch vendor id
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: authUser.userId }
    });

    if (!vendor) {
      return errorResponse("متجر غير موجود", 404);
    }

    // Since payouts are processed by Admin fetching pending subOrders,
    // a "Payout Request" from the vendor is basically a notification to the Admin.
    // For now, we will just record a notification for the Vendor to confirm we received it.
    
    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        title: "طلب سحب أرباح",
        message: "تم استلام طلبك لسحب الأرباح بنجاح، جاري المراجعة والتحويل قريباً.",
        type: "PAYOUT_REQUESTED"
      }
    });

    // TODO: Ideally, we should also notify Admin here, or mark payouts as 'requested' instead of 'pending'.
    
    // We could also send a Push Notification to the vendor here using Expo
    
    return successResponse({ message: "تم تقديم الطلب بنجاح" });
  } catch (error) {
    return handleApiError(error);
  }
}
