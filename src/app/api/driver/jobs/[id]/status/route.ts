import { errorResponse } from "@/lib/api-response";

export async function PATCH() {
  return errorResponse(
    "تم إيقاف التحديث المباشر للحالة. استخدم مسارات التحقق برمز الاستلام أو التسليم.",
    405
  );
}
