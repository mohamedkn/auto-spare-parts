import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

function distanceBetweenKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat2 - lat1);
  const lngDelta = toRadians(lng2 - lng1);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(request, "driver");

    // 1. Check driver profile and verify status
    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: authUser.userId },
    });

    if (!driver) {
      return errorResponse("لم يتم العثور على حساب مندوب التوصيل الخاص بك.", 404);
    }

    if (!driver.isVerified) {
      return errorResponse("حسابك قيد المراجعة ولا يمكنك استقبال طلبات حالياً.", 403);
    }

    if (driver.status === "offline") {
      return errorResponse("أنت غير متصل. يرجى تغيير حالتك لتتمكن من رؤية الطلبات.", 400);
    }

    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const driverLat = Number(latParam);
    const driverLng = Number(lngParam);
    const hasDriverLocation = latParam !== null && lngParam !== null
      && Number.isFinite(driverLat) && Number.isFinite(driverLng)
      && Math.abs(driverLat) <= 90 && Math.abs(driverLng) <= 180;

    // 2. Fetch available jobs (in pending or broadcasted state)
    // Note: In a production scale with Redis, this would be a geospatial query.
    // Here we use Prisma directly as MVP.
    const jobs = await prisma.deliveryJob.findMany({
      where: {
        status: { in: ["pending", "broadcasted"] },
      },
      include: {
        subOrder: {
          include: {
            vendor: {
              select: {
                storeName: true,
                logoUrl: true,
                address: true,
                latitude: true,
                longitude: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: hasDriverLocation ? 100 : 20,
    });

    const availableJobs = jobs
      .map((job) => {
        const vendorLat = job.subOrder.vendor.latitude;
        const vendorLng = job.subOrder.vendor.longitude;
        const hasVerifiedPickup = vendorLat !== null && vendorLng !== null;

        // الطلب ذو الموقع الناقص يجب أن يظهر للمندوب مع تنبيه، ولا يُنسب
        // خطأً إلى إحداثيات افتراضية ثم يختفي بفلتر المسافة.
        if (!hasVerifiedPickup) {
          return {
            ...job,
            pickupLat: null,
            pickupLng: null,
            distanceKm: null,
            locationPending: true,
          };
        }

        const pickupLat = Number(vendorLat);
        const pickupLng = Number(vendorLng);
        if (!hasDriverLocation) {
          return { ...job, pickupLat, pickupLng, locationPending: false };
        }

        const distanceKm = distanceBetweenKm(driverLat, driverLng, pickupLat, pickupLng);
        return {
          ...job,
          pickupLat,
          pickupLng,
          distanceKm: Number(distanceKm.toFixed(2)),
          locationPending: false,
        };
      })
      .filter((job) => job.locationPending || !hasDriverLocation || (job.distanceKm !== null && Number(job.distanceKm) <= 50))
      .sort((left, right) => {
        if (!hasDriverLocation) return 0;
        return Number(left.distanceKm ?? Number.MAX_SAFE_INTEGER) - Number(right.distanceKm ?? Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 20);

    return successResponse({
      message: "تم جلب الطلبات المتاحة بنجاح",
      jobs: availableJobs
    });
  } catch (error) {
    return handleApiError(error);
  }
}
