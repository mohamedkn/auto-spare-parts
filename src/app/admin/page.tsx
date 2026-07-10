import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ShoppingBag, CreditCard, Activity, Banknote } from "lucide-react";
import { VendorApprovalButtons } from "./components/VendorApprovalButtons";
import { PayoutButton } from "./components/PayoutButton";
import { DashboardChart } from "@/components/vendor/DashboardChart";

type VendorPayoutSummary = {
  vendorId: string;
  storeName: string;
  totalPayoutDue: number;
  subOrdersCount: number;
  totalCommission: number;
  totalSubtotal: number;
  bankAccount: string | null;
  instapayHandle: string | null;
  walletPhone: string | null;
};

export default async function AdminDashboard() {
  const session = await getUserSession();

  // Basic admin check
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Fetch pending vendors
  const pendingVendors = await prisma.vendor.findMany({
    where: { status: "pending" },
    include: { owner: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Fetch pending payouts (Admin logic)
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      status: "pending",
    },
    include: {
      subOrder: { select: { subtotal: true, commissionAmount: true, vendorPayoutAmount: true } },
      vendor: {
        select: { 
          id: true, 
          storeName: true,
          bankAccount: true,
          instapayHandle: true,
          walletPhone: true
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group payouts by vendor
  const payoutsByVendor = pendingPayouts.reduce((acc, payout) => {
    const vId = payout.vendorId;
    if (!acc[vId]) {
      acc[vId] = {
        vendorId: vId,
        storeName: payout.vendor.storeName,
        totalPayoutDue: 0,
        subOrdersCount: 0,
        totalCommission: 0,
        totalSubtotal: 0,
        bankAccount: payout.vendor.bankAccount,
        instapayHandle: payout.vendor.instapayHandle,
        walletPhone: payout.vendor.walletPhone,
      };
    }
    acc[vId].totalSubtotal += Number(payout.subOrder.subtotal);
    acc[vId].totalCommission += Number(payout.subOrder.commissionAmount);
    acc[vId].totalPayoutDue += Number(payout.amount);
    acc[vId].subOrdersCount += 1;
    return acc;
  }, {} as Record<string, VendorPayoutSummary>);
  const vendorPayoutsList = Object.values(payoutsByVendor);

  // Fetch recent orders
  const recentOrders = await prisma.order.findMany({
    where: { subOrders: { some: {} } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      payments: { select: { status: true, amount: true } },
    },
  });

  // Stats
  const totalVendors = await prisma.vendor.count();
  const totalOrders = await prisma.order.count({ where: { subOrders: { some: {} } } });
  const onlineRevenue = await prisma.payment.aggregate({
    where: { status: "succeeded", provider: { not: "cod" } },
    _sum: { amount: true },
  });

  const cashRevenue = await prisma.payment.aggregate({
    where: { 
      provider: "cash_on_delivery",
      OR: [
        { status: "succeeded" },
        { 
          order: {
            subOrders: { some: { status: "delivered" } }
          }
        }
      ]
    },
    _sum: { amount: true },
  });
  // Chart Data (Last 30 Days Platform Sales)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrdersForChart = await prisma.subOrder.findMany({
    where: { 
      status: "delivered",
      order: { payments: { some: { status: "succeeded" } } },
      createdAt: { gte: thirtyDaysAgo }
    },
    select: { createdAt: true, subtotal: true }
  });

  const salesByDay = recentOrdersForChart.reduce((acc, order) => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr] += Number(order.subtotal);
    return acc;
  }, {} as Record<string, number>);

  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' });
    const sales = salesByDay[dateStr] || 0;
    chartData.push({
      date: dateStr,
      displayDate,
      sales: sales
    });
  }

  // Top Vendors (By Total Suborder Amount - Actual Sales Only)
  const topVendorsQuery = await prisma.subOrder.groupBy({
    by: ['vendorId'],
    where: {
      status: 'delivered',
      order: { payments: { some: { status: "succeeded" } } },
    },
    _sum: { 
      subtotal: true,
      vendorPayoutAmount: true,
      commissionAmount: true
    },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: 5,
  });

  const topVendorIds = topVendorsQuery.map(v => v.vendorId);
  const topVendorsData = topVendorIds.length > 0 ? await prisma.vendor.findMany({
    where: { id: { in: topVendorIds } },
    select: { id: true, storeName: true }
  }) : [];

  const topVendors = topVendorsQuery.map(v => ({
    ...topVendorsData.find(vd => vd.id === v.vendorId),
    totalSales: v._sum.subtotal || 0,
    vendorPayout: v._sum.vendorPayoutAmount || 0,
    platformCommission: v._sum.commissionAmount || 0
  })).filter(v => v.id);

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-l from-amber-400/[0.09] via-zinc-900/80 to-zinc-900/60 px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
        <div className="absolute -left-16 -top-20 size-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative">
          <span className="mb-3 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">مركز العمليات</span>
          <h1 className="text-3xl font-black text-white">لوحة تحكم الإدارة</h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">نظرة موحّدة على أداء المنصة والمتاجر والطلبات والتسويات</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/admin/vendors" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-zinc-900">
          <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي المتاجر</p>
            <p className="text-2xl font-black text-white transition-colors group-hover:text-amber-300">{totalVendors}</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalOrders}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
          <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">دفع إلكتروني</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(onlineRevenue._sum.amount || 0)} ج.م</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
          <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">تحصيل نقدي</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(cashRevenue._sum.amount || 0)} ج.م</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
          <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">متاجر قيد المراجعة</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingVendors.length}</p>
          </div>
        </div>
      </div>

      {/* Analytics Section: Chart & Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales Chart */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl shadow-black/10 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">إجمالي المبيعات</h2>
            <span className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">آخر 30 يوماً</span>
          </div>
          <DashboardChart data={chartData} />
        </div>

        {/* Top Vendors */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">أفضل المتاجر</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            {topVendors.length > 0 ? (
              topVendors.map((v, idx) => (
                <div key={v.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{v.storeName}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg flex-1 text-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block mb-0.5 text-[10px]">الدخل الإجمالي</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{Number(v.totalSales).toFixed(0)}</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg flex-1 text-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block mb-0.5 text-[10px]">صافي التاجر</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Number(v.vendorPayout).toFixed(0)}</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg flex-1 text-center border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block mb-0.5 text-[10px]">عمولتي</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{Number(v.platformCommission).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                لا توجد بيانات كافية
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pending Payouts */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">تسويات مستحقة للمتاجر</h2>
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {vendorPayoutsList.length} متجر
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
            {vendorPayoutsList.length > 0 ? (
              vendorPayoutsList.map((vp) => (
                <div key={vp.vendorId} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{vp.storeName}</h3>
                    <p className="text-slate-500 text-sm mb-1">عدد الطلبات: {vp.subOrdersCount}</p>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p><span className="font-medium text-slate-700 dark:text-slate-300">الإجمالي:</span> {vp.totalSubtotal.toFixed(2)} ج.م</p>
                      <p><span className="font-medium text-amber-600 dark:text-amber-500">عمولة المنصة:</span> {vp.totalCommission.toFixed(2)} ج.م</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-[200px] text-xs space-y-1 bg-indigo-50/50 dark:bg-indigo-900/10 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <p className="font-semibold text-indigo-800 dark:text-indigo-300 mb-1 border-b border-indigo-200 dark:border-indigo-800/50 pb-1">بيانات الدفع المعتمدة:</p>
                    <p><span className="text-slate-500">الحساب البنكي:</span> <span className="font-medium text-slate-900 dark:text-white">{vp.bankAccount || 'غير مسجل'}</span></p>
                    {vp.instapayHandle && <p><span className="text-slate-500">إنستاباي:</span> <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{vp.instapayHandle}</span></p>}
                    {vp.walletPhone && <p><span className="text-slate-500">المحفظة:</span> <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{vp.walletPhone}</span></p>}
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium">الصافي المستحق</p>
                      <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{vp.totalPayoutDue.toFixed(2)} <span className="text-sm font-medium">ج.م</span></span>
                    </div>
                    <PayoutButton vendorId={vp.vendorId} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                لا توجد تسويات مالية مستحقة.
              </div>
            )}
          </div>
        </div>

        {/* Pending Vendors */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">طلبات الانضمام (المتاجر)</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingVendors.length > 0 ? (
              pendingVendors.map((vendor) => (
                <div key={vendor.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{vendor.storeName}</h3>
                    <p className="text-slate-500 text-sm">{vendor.owner.name} ({vendor.owner.email})</p>
                    <p className="text-slate-500 text-sm mt-1">تاريخ الطلب: {new Date(vendor.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <VendorApprovalButtons vendorId={vendor.id} />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                لا توجد طلبات انضمام جديدة.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">عرض الكل</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 font-medium">رقم الطلب</th>
                  <th className="p-4 font-medium">العميل</th>
                  <th className="p-4 font-medium">المبلغ</th>
                  <th className="p-4 font-medium">الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((order) => {
                  const payment = order.payments[0];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4 font-medium">
                        <Link href={`/admin/orders/${order.id}`} className="text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block w-full h-full">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{order.user.name}</p>
                        <p className="text-xs text-slate-500">{order.user.email}</p>
                      </td>
                      <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{Number(order.totalAmount)} ج.م</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment?.status === "succeeded"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {payment?.status === "succeeded" ? "ناجح" : "قيد الانتظار"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      لا توجد طلبات حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
