"use server";

import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { sendVendorApprovalEmail } from "@/lib/services/email";

export async function approveVendor(vendorId: string) {
  const session = await getUserSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: "approved" },
    include: { owner: { select: { email: true } } },
  });

  void sendVendorApprovalEmail(vendor.owner.email, vendor.storeName);

  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  return { success: true };
}

export async function rejectVendor(vendorId: string) {
  const session = await getUserSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Preserve products and financial history; rejection is a reversible status.
  await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: "suspended" },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  return { success: true };
}

export async function processVendorPayout(vendorId: string, bankReference: string) {
  const session = await getUserSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  const normalizedReference = bankReference.trim();
  if (normalizedReference.length < 3 || normalizedReference.length > 100) {
    throw new Error("Bank reference is required");
  }

  // Find all pending payouts for this vendor
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      vendorId: vendorId,
      status: "pending",
    },
    include: {
      subOrder: {
        include: {
          deliveryJob: true,
          order: { include: { payments: { where: { status: "succeeded" } } } },
        },
      },
    },
  });

  if (pendingPayouts.length === 0) {
    return { success: false, message: "لا توجد تسويات مستحقة" };
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const ineligible = pendingPayouts.find((payout) => {
    const job = payout.subOrder.deliveryJob;
    return payout.subOrder.status !== "delivered"
      || !job?.deliveredAt
      || job.deliveredAt > threeDaysAgo
      || payout.subOrder.order.payments.length === 0;
  });
  if (ineligible) {
    throw new Error("توجد تسوية غير مؤهلة للدفع بعد");
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

  // Update payout records to paid
  await prisma.$transaction([
    ...pendingPayouts.map((payout) =>
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: "paid",
          paidAt: new Date(),
          bankReference: normalizedReference,
        },
      })
    ),
    ...(vendor ? [
      prisma.notification.create({
        data: {
          userId: vendor.ownerId,
          title: "تم تسوية الأرباح",
          message: `تم تحويل وتسوية أرباحك لعدد ${pendingPayouts.length} طلبات بنجاح.`,
          type: "PAYOUT_SETTLED"
        }
      })
    ] : [])
  ]);

  revalidatePath("/admin");
  return { success: true, count: pendingPayouts.length };
}
