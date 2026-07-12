import { prisma } from "@/lib/db";
import { Store, Star, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { VendorApprovalButtons } from "../components/VendorApprovalButtons";

export const metadata = {
  title: "المتاجر | لوحة الإدارة",
};

const specialtyLabels = { german: "ألماني", korean: "كوري", japanese: "ياباني", american: "أمريكي", chinese: "صيني", european: "أوروبي آخر", other: "أخرى" } as const;

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({
    include: {
      owner: { select: { name: true, email: true, phone: true } },
      _count: { select: { products: true } },
      subOrders: {
        where: { status: 'delivered' },
        select: {
          subtotal: true,
          vendorPayoutAmount: true,
          commissionAmount: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المتاجر</h1>
          <p className="text-sm text-slate-500 mt-1">عرض وإدارة جميع المتاجر المسجلة في المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => {
          const totalSales = vendor.subOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);
          const vendorShare = vendor.subOrders.reduce((sum, order) => sum + Number(order.vendorPayoutAmount), 0);
          const adminShare = vendor.subOrders.reduce((sum, order) => sum + Number(order.commissionAmount), 0);

          return (
            <div key={vendor.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate" title={vendor.storeName}>
                      {vendor.storeName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-sm text-slate-500">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>{vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : "جديد"}</span>
                      <span className="text-slate-400">({vendor.reviewsCount})</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  vendor.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  vendor.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {vendor.status === 'approved' ? 'نشط' : vendor.status === 'pending' ? 'قيد المراجعة' : 'موقوف'}
                </span>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">تخصصات المتجر</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.specialties.length ? vendor.specialties.map((specialty) => <span key={specialty} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{specialtyLabels[specialty]}</span>) : <span className="text-xs text-slate-400">كل الفروع — حساب قديم</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">العمولة المتفق عليها</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{Number(vendor.commissionRate)}%</span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">إجمالي الدخل (مبيعات المتجر)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalSales)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-500">أرباح التاجر (الصافي له)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(vendorShare)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">أرباح المنصة (العمولة)</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(adminShare)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-slate-500">عدد المنتجات</span>
                  <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                    {vendor._count.products} <Package size={14} className="text-slate-400" />
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 mt-auto">
                {vendor.status === 'pending' && (
                  <VendorApprovalButtons vendorId={vendor.id} />
                )}
              </div>
            </div>
          );
        })}

        {vendors.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Store className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">لا يوجد متاجر بعد</h3>
            <p className="text-slate-500">لم يقم أي بائع بالتسجيل حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
