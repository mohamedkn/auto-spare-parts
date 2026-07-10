import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { OrdersFilter } from "./components/OrdersFilter";
import { PaymentStatus, type Prisma } from "@prisma/client";

export const metadata = {
  title: "إدارة الطلبات | لوحة التحكم",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getUserSession();

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const filters = await searchParams;
  const q = typeof filters.q === 'string' ? filters.q : undefined;
  const rawPaymentStatus = typeof filters.paymentStatus === "string" ? filters.paymentStatus : undefined;
  const paymentStatus = rawPaymentStatus && Object.values(PaymentStatus).includes(rawPaymentStatus as PaymentStatus)
    ? rawPaymentStatus as PaymentStatus
    : undefined;
  const dateRange = typeof filters.dateRange === 'string' ? filters.dateRange : undefined;

  // Build where clause based on searchParams
  const whereClause: Prisma.OrderWhereInput = { subOrders: { some: {} } };
  
  if (q) {
    whereClause.orderNumber = { contains: q, mode: 'insensitive' };
  }
  
  if (paymentStatus) {
    whereClause.payments = {
      some: { status: paymentStatus }
    };
  }

  if (dateRange) {
    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereClause.createdAt = { gte: today };
    } else if (dateRange === 'this_month') {
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      whereClause.createdAt = { gte: thisMonth };
    } else if (dateRange === 'this_year') {
      const thisYear = new Date(now.getFullYear(), 0, 1);
      whereClause.createdAt = { gte: thisYear };
    }
  }

  // Fetch orders
  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      subOrders: { select: { id: true, vendorId: true } }, // just to know how many subOrders
    },
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="text-amber-400" size={32} />
            إدارة الطلبات
          </h1>
          <p className="text-slate-500 mt-2">عرض جميع الطلبات في المنصة ومتابعة حالتها</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <OrdersFilter />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white dark:bg-slate-900 text-slate-500 text-sm border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-medium whitespace-nowrap">رقم الطلب</th>
                <th className="p-4 font-medium">العميل</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">المبلغ الإجمالي</th>
                <th className="p-4 font-medium">المتاجر المشتركة</th>
                <th className="p-4 font-medium">حالة الدفع</th>
                <th className="p-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => {
                const payment = order.payments[0];
                return (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-indigo-600 transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.user.name}</p>
                      <p className="text-xs text-slate-500">{order.user.email}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {Number(order.totalAmount).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 font-medium">
                        {order.subOrders.length}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        payment?.status === "succeeded"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {payment?.status === "succeeded" ? "مدفوع (ناجح)" : "قيد الانتظار"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg transition-colors">
                        التفاصيل
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد طلبات في المنصة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
