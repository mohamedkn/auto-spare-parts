/**
 * Admin Vendor Status API
 * ─────────────────────────────────────
 * PATCH /api/admin/vendors/:id/status — تغيير حالة متجر (موافقة/رفض/إيقاف)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { updateVendorStatusSchema } from "@/lib/validations/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";
import { sendVendorApprovalEmail } from "@/lib/services/email";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/vendors/[id]/status">
) {
  try {
    // 🔒 Authorization: Admin only
    await requireRole(request, "admin");
    const { id } = await ctx.params;

    const body = await request.json();
    const data = updateVendorStatusSchema.parse(body);

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { owner: { select: { email: true } } },
    });

    if (!vendor) {
      return errorResponse("المتجر مش موجود", 404);
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: { status: data.status },
    });

    if (data.status === "approved" && vendor.status !== "approved" && vendor.owner?.email) {
      sendVendorApprovalEmail(vendor.owner.email, vendor.storeName);
    }

    return successResponse({
      message: `تم تحديث حالة المتجر إلى ${data.status}`,
      vendor: updatedVendor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
