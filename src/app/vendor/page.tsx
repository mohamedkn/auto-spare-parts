import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { ShoppingCart, TrendingUp, AlertCircle, ArrowUpRight, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { DashboardChart } from "@/components/vendor/DashboardChart";

export default async function VendorDashboard() {
  const session = await getUserSession();
  if (!session) return redirect("/login");
  
  const vendor = await prisma.vendor.findUnique({
    where: { ownerId: session.userId },
  });

  if (!vendor) return null;

  // Basic Stats
  const [ordersCount, pendingOrdersCount] = await Promise.all([
    prisma.subOrder.count({ where: { vendorId: vendor.id } }),
    prisma.subOrder.count({ where: { vendorId: vendor.id, status: "pending" } }),
  ]);

  // Earnings
  const earned = await prisma.subOrder.aggregate({
    where: {
      vendorId: vendor.id,
      status: "delivered",
      deliveryJob: { is: { status: "delivered" } },
      order: { payments: { some: { status: "succeeded" } } },
    },
    _sum: { vendorPayoutAmount: true, subtotal: true },
    _count: { id: true },
  });

  const totalRevenue = Number(earned._sum.vendorPayoutAmount || 0);
  const aov = earned._count.id > 0 ? (Number(earned._sum.subtotal || 0) / earned._count.id).toFixed(0) : 0;

  // Chart Data (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrdersForChart = await prisma.subOrder.findMany({
    where: { 
      vendorId: vendor.id,
      createdAt: { gte: thirtyDaysAgo },
      status: "delivered",
      deliveryJob: { is: { status: "delivered" } },
      order: { payments: { some: { status: "succeeded" } } },
    },
    select: { createdAt: true, subtotal: true, vendorPayoutAmount: true }
  });

  const salesByDay = recentOrdersForChart.reduce((acc, order) => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr] += Number(order.subtotal);
    return acc;
  }, {} as Record<string, number>);
  const earningsByDay = recentOrdersForChart.reduce((acc, order) => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    acc[dateStr] = (acc[dateStr] || 0) + Number(order.vendorPayoutAmount);
    return acc;
  }, {} as Record<string, number>);

  const chartData = [];
  let currentMonthEarnings = 0;
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
    currentMonthEarnings += earningsByDay[dateStr] || 0;
  }

  // Recent Orders (Last 5)
  const recentOrders = await prisma.subOrder.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      order: { select: { user: { select: { name: true } }, orderNumber: true } }
    }
  });

  // Top Products
  const topProductsQuery = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      subOrder: {
        vendorId: vendor.id,
        status: "delivered",
        order: { payments: { some: { status: "succeeded" } } },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const topProductIds = topProductsQuery.map(p => p.productId);
  const topProductsData = topProductIds.length > 0 ? await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, price: true, images: { take: 1 } }
  }) : [];

  const topProducts = topProductsQuery.map(p => ({
    ...topProductsData.find(pd => pd.id === p.productId),
    totalSold: p._sum.quantity
  })).filter(p => p.id);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-medium">جديد</span>;
      case 'preparing': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">جاري التجهيز</span>;
      case 'processing': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">جاهز للتسليم</span>;
      case 'shipped': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-medium">تم الشحن</span>;
      case 'delivered': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">تم التوصيل</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">ملغي</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">أهلاً بك، {vendor.storeName}</h1>
          <p className="text-slate-500">إليك نظرة عامة على أداء متجرك اليوم.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/vendor/products/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
            إضافة منتج
          </Link>
        </div>
      </div>

      {vendor.status !== "approved" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex gap-4 items-start shadow-sm">
          <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-300">متجرك قيد المراجعة</h3>
            <p className="text-amber-700 dark:text-amber-400 mt-1">
              لقد قمنا باستلام طلبك لإنشاء المتجر وهو حالياً قيد المراجعة من الإدارة. يمكنك تجهيز منتجاتك الآن، لكن لن تظهر للعملاء حتى تتم الموافقة.
            </p>
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">إجمالي الأرباح</p>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{totalRevenue.toLocaleString()} ج.م</h3>
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
             <ArrowUpRight size={14} /> +{currentMonthEarnings.toLocaleString()} ج.م هذا الشهر
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">إجمالي الطلبات</p>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShoppingCart size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{ordersCount}</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">طلبات مكتملة وقيد التنفيذ</p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">متوسط قيمة الطلب (AOV)</p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{aov} ج.م</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">متوسط الأرباح لكل طلب</p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-500 font-medium">طلبات جديدة</p>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{pendingOrdersCount}</h3>
          <Link href="/vendor/orders?status=pending" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
            عرض الطلبات التي تحتاج شحن &larr;
          </Link>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">المبيعات (آخر 30 يوم)</h2>
            <p className="text-sm text-slate-500">نظرة عامة على أداء مبيعاتك خلال الشهر الأخير</p>
          </div>
        </div>
        <DashboardChart data={chartData} />
      </div>

      {/* Grid: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">أحدث الطلبات</h2>
            <Link href="/vendor/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">عرض الكل</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">الطلب</th>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-6 py-3 font-medium">العميل</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      لا توجد طلبات حتى الآن.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <Link href={`/vendor/orders/${order.id}`} className="hover:text-indigo-600">
                          #{order.order.orderNumber?.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {order.order.user?.name || 'عميل'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusLabel(order.status)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {Number(order.subtotal)} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">المنتجات الأكثر مبيعاً</h2>
          </div>
          <div className="p-4 space-y-4">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                لا توجد مبيعات للمنتجات بعد.
              </div>
            ) : (
              topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400 shrink-0 overflow-hidden relative border border-slate-200 dark:border-slate-700">
                    {product.images?.[0]?.url ? (
                      <Image src={`https://res.cloudinary.com/dwy7k2cxx/image/upload/${product.images[0].url}`} alt={product.name || "منتج"} fill sizes="48px" className="object-cover" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{Number(product.price)} ج.م</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{product.totalSold}</p>
                    <p className="text-xs text-slate-500">مبيعات</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Link href="/vendor/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 w-full text-center block">
              إدارة جميع المنتجات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
