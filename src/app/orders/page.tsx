import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Package, Clock, CheckCircle, Truck, XCircle, Wrench, User, Phone, Key } from "lucide-react";
import { AutoRefresh } from "@/components/AutoRefresh";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="text-yellow-500" />;
    case "confirmed":
      return <CheckCircle className="text-indigo-500" />;
    case "preparing":
    case "processing":
      return <Wrench className="text-orange-500" />;
    case "shipped":
      return <Truck className="text-blue-500" />;
    case "delivered":
      return <CheckCircle className="text-emerald-500" />;
    case "cancelled":
      return <XCircle className="text-red-500" />;
    default:
      return <Package className="text-slate-500" />;
  }
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "تم التأكيد",
    preparing: "جاري التجهيز",
    processing: "جاري المعالجة",
    shipped: "جاري التوصيل",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };
  return map[status] || status;
};

export default async function OrdersPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: {
      subOrders: {
        include: {
          vendor: { select: { storeName: true } },
          items: {
            include: {
              product: {
                select: { name: true, images: { select: { url: true }, take: 1 } },
              },
              variant: {
                select: { name: true },
              },
            },
          },
          deliveryJob: {
            include: {
              driver: {
                include: { user: { select: { name: true, phone: true } } }
              }
            }
          }
        },
      },
      payments: {
        select: { status: true, amount: true, provider: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
      <AutoRefresh intervalMs={15000} />
      
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">سجل الطلبات</h1>
        <p className="text-slate-500 mt-2">تتبع حالة طلباتك الحالية والسابقة</p>
      </div>

      {orders.length > 0 ? (
        <div className="flex flex-col gap-8">
          {orders.map((order) => {
            const payment = order.payments[0];
            return (
              <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap gap-8">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">رقم الطلب</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">تاريخ الطلب</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">الإجمالي</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">
                        {Number(order.totalAmount)} ج.م
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">حالة الدفع</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment?.status === "succeeded"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {payment?.status === "succeeded" ? "تم الدفع" : "قيد الدفع"}
                    </span>
                  </div>
                </div>

                {/* SubOrders */}
                <div className="p-6 flex flex-col gap-6">
                  {order.subOrders.map((sub) => (
                    <div key={sub.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/50">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">متجر: {sub.vendor.storeName}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm font-medium">
                          {getStatusIcon(sub.status)}
                          <span className="text-slate-700 dark:text-slate-300">{getStatusText(sub.status)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {sub.items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
                              {item.product.images[0]?.url ? (
                                <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                              ) : (
                                <Package className="absolute inset-0 m-auto text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <Link href={`/products/${item.productId}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">
                                {item.product.name}
                              </Link>
                              <div className="text-sm text-slate-500 mt-1">
                                {item.variant && <span className="mr-2">النوع: {item.variant.name}</span>}
                                <span>الكمية: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {Number(item.totalPrice)} ج.م
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* معلومات التوصيل والتتبع */}
                      {sub.deliveryJob && (sub.status === "shipped" || sub.status === "delivered") && (
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Truck size={16} className="text-indigo-500" /> معلومات التوصيل
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* بيانات المندوب */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                              <p className="text-xs text-slate-500 mb-2">بيانات المندوب</p>
                              {sub.deliveryJob.driver ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      {sub.deliveryJob.driver.user.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400" dir="ltr">
                                      {sub.deliveryJob.driver.user.phone}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">جاري البحث عن مندوب...</p>
                              )}
                            </div>

                            {/* رمز الاستلام */}
                            {sub.status === "shipped" && sub.deliveryJob.deliveryOtp && (
                              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                <div className="flex items-center gap-2 mb-1">
                                  <Key size={14} className="text-indigo-600 dark:text-indigo-400" />
                                  <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">رمز استلام الطلب</p>
                                </div>
                                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-[0.2em] my-1">
                                  {sub.deliveryJob.deliveryOtp}
                                </p>
                                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-1">
                                  أعط هذا الرمز للمندوب عند استلامك للطلب
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Package size={64} className="mb-6 opacity-30 text-indigo-500" />
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">لا توجد طلبات</h3>
          <p className="mb-6">لم تقم بإجراء أي طلبات حتى الآن.</p>
          <Link href="/products" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-colors">
            تصفح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}
