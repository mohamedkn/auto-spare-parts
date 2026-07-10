import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "driver");

    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
    });

    if (!driver) {
      return errorResponse("لم يتم العثور على حساب مندوب التوصيل الخاص بك.", 404);
    }

    const myJobs = await prisma.deliveryJob.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: ["accepted", "picked_up", "on_the_way"]
        }
      },
      include: {
        subOrder: {
          include: {
            order: {
              select: {
                shippingAddress: true,
                user: {
                  select: { name: true, phone: true }
                }
              }
            },
            vendor: {
              select: { storeName: true, address: true }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return successResponse({ jobs: myJobs });
  } catch (error) {
    return handleApiError(error);
  }
}
