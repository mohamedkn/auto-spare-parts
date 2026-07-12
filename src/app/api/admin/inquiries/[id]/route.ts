import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { reviewInquirySchema } from "@/lib/validations/inquiry";
import { getBiddingEndsAt } from "@/lib/inquiries/constants";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { sendPushNotifications } from "@/lib/expoPush";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, "admin");
    const { id } = await params;
    const data = reviewInquirySchema.parse(await request.json());
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) return errorResponse("طلب التسعير غير موجود", 404);
    if (existing.status !== "under_review") return errorResponse("تمت مراجعة هذا الطلب بالفعل", 409);

    const startsAt = new Date();
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: data.action === "approve"
        ? { status: "open", adminNotes: data.adminNotes, aiParsedData: data.parsedData ?? (existing.aiParsedData === null ? Prisma.JsonNull : existing.aiParsedData as Prisma.InputJsonValue), biddingStartsAt: startsAt, biddingEndsAt: getBiddingEndsAt(startsAt) }
        : { status: "cancelled", adminNotes: data.adminNotes || "رفضه الأدمن" },
    });

    if (data.action === "approve") {
      const parsedPartName = data.parsedData?.partName
        || (existing.aiParsedData && typeof existing.aiParsedData === "object" && "partName" in existing.aiParsedData
          ? String(existing.aiParsedData.partName)
          : existing.description.slice(0, 90));
      const vendors = await prisma.vendor.findMany({
        where: {
          status: "approved",
          ...(existing.vehicleMarkets.length > 0
            ? { OR: [{ specialties: { isEmpty: true } }, { specialties: { hasSome: existing.vehicleMarkets } }] }
            : {}),
        },
        select: { owner: { select: { id: true, expoPushToken: true } } },
      });

      if (vendors.length > 0) {
        await Promise.all([
          prisma.notification.createMany({
            data: vendors.map(({ owner }) => ({
              userId: owner.id,
              title: "طلب عميل جديد ⚡",
              message: `${parsedPartName} — أمامك 5 دقائق لتقديم عرضك.`,
              type: "NEW_INQUIRY",
            })),
          }),
          sendPushNotifications(
            vendors
              .filter(({ owner }) => Boolean(owner.expoPushToken))
              .map(({ owner }) => ({
                expoPushToken: owner.expoPushToken!,
                title: "طلب عميل جديد ⚡",
                body: `${parsedPartName} — افتح الرادار وقدّم عرضك الآن.`,
                data: { type: "NEW_INQUIRY", inquiryId: inquiry.id, url: "/logo" },
                channelId: "b2b-requests",
              })),
          ),
        ]);
      }
    }
    return successResponse(inquiry);
  } catch (error) {
    return handleApiError(error);
  }
}
