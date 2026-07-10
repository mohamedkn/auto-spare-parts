import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Truck } from "lucide-react";

export const metadata = {
  title: "لوحة تحكم الكابتن | زي ماركت بليس",
};

export default async function DriverDashboardPage() {
  const user = await getUserSession();
  if (!user || user.role !== "driver") {
    redirect("/login");
  }

  const driverProfile = await prisma.deliveryDriver.findUnique({
    where: { userId: user.userId },
  });

  if (!driverProfile) {
    return <div className="p-8 text-center text-red-600">حدث خطأ: لم يتم العثور على ملف الكابتن.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-4 space-x-reverse mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">أهلاً بك يا كابتن</h1>
            <p className="text-slate-600">هذه هي لوحة التحكم الخاصة بك لإدارة مهام التوصيل.</p>
          </div>
        </div>

        {!driverProfile.isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-1">حسابك قيد المراجعة ⏳</h3>
            <p className="text-sm">
              نقوم حالياً بمراجعة بياناتك. بمجرد توثيق حسابك، ستتمكن من رؤية واستقبال طلبات التوصيل القريبة منك.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-500 mb-1">رصيد محفظة التوصيل</h3>
            <p className="text-2xl font-bold text-slate-900">{driverProfile.walletBalance.toString()} ج.م</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-500 mb-1">الكاش المحصل (COD)</h3>
            <p className="text-2xl font-bold text-slate-900">{driverProfile.cashOnHandBalance.toString()} ج.م</p>
            <p className="text-xs text-slate-500 mt-1">الحد الأقصى: {driverProfile.cashLimit.toString()} ج.م</p>
          </div>
        </div>
      </div>
    </div>
  );
}
