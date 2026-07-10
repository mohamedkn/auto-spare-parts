import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Wallet, ArrowDownRight, History, CheckCircle2 } from "lucide-react";

export default async function VendorPayoutsPage() {
  const session = await getUserSession();
  if (!session) return redirect("/login");
  
  const vendor = await prisma.vendor.findUnique({
    where: { ownerId: session.userId },
  });

  if (!vendor) return redirect("/");

  // Fetch Payouts Data (Similar to GET /api/vendor/payouts)
  const pendingSubOrders = await prisma.subOrder.findMany({
    where: {
      vendorId: vendor.id,
      status: "delivered",
      payout: null, // No payout yet
    },
    select: {
      id: true,
      order: { select: { orderNumber: true } },
      subtotal: true,
      commissionAmount: true,
      vendorPayoutAmount: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const paidPayouts = await prisma.payout.findMany({
    where: {
      vendorId: vendor.id,
      status: "paid",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      paidAt: true,
      subOrder: {
        select: { order: { select: { orderNumber: true } } },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const pendingBalance = pendingSubOrders.reduce((sum, so) => sum + Number(so.vendorPayoutAmount), 0);
  const totalPaid = paidPayouts.reduce((sum, po) => sum + Number(po.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المحفظة والسحب</h1>
          <p className="text-slate-500">إدارة أرباحك وطلبات السحب</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          disabled={pendingBalance <= 0}
        >
          طلب سحب الرصيد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 opacity-90 mb-8">
              <Wallet size={24} />
              <span className="font-medium text-lg">الرصيد المتاح للسحب</span>
            </div>
            <div>
              <p className="text-5xl font-bold tracking-tight mb-2">{pendingBalance.toFixed(2)} ج.م</p>
              <p className="text-indigo-100 text-sm">أرباح طلبات تم توصيلها بنجاح</p>
            </div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 mb-8">
            <History size={24} />
            <span className="font-medium text-lg">إجمالي ما تم سحبه</span>
          </div>
          <div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{totalPaid.toFixed(2)} ج.م</p>
            <p className="text-slate-500 text-sm">تم تحويلها لحسابك البنكي مسبقاً</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Orders ready for payout */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowDownRight className="text-amber-500" />
              أرباح معلقة (ستحول تلقائياً)
            </h2>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingSubOrders.length} طلب
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
            {pendingSubOrders.map((so) => (
              <div key={so.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">طلب رقم #{so.order.orderNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">تم التوصيل: {new Date(so.updatedAt).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">{Number(so.vendorPayoutAmount)} ج.م</p>
                  <p className="text-xs text-slate-400">بعد خصم العمولة</p>
                </div>
              </div>
            ))}
            {pendingSubOrders.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                لا توجد أرباح معلقة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* Paid History */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" />
              سجل السحوبات
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
            {paidPayouts.map((po) => (
              <div key={po.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">دفعة لطلب #{po.subOrder.order.orderNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">تاريخ التحويل: {po.paidAt ? new Date(po.paidAt).toLocaleDateString("ar-EG") : ""}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">+{Number(po.amount)} ج.م</p>
                  <p className="text-xs text-slate-400">تم التحويل بنجاح</p>
                </div>
              </div>
            ))}
            {paidPayouts.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                لا يوجد سجل سحوبات حتى الآن.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
