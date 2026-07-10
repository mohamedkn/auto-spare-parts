import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package, MapPin, CreditCard, User, Store, Activity } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "تفاصيل الطلب | لوحة التحكم",
};

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  const { id } = await params;

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      user: true,
      payments: true,
      subOrders: {
        include: {
          vendor: true,
          items: {
            include: {
              product: {
                include: {
                  images: true,
                }
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const payment = order.payments[0];
  const shippingAddress = order.shippingAddress as any; // Ensure it matches JSON structure

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4">
          <ArrowRight size={16} className="ml-1" />
          العودة للطلبات
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              طلب #{order.orderNumber}
            </h1>
            <p className="text-slate-500 mt-2">
              تم الإنشاء في {new Date(order.createdAt).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              payment?.status === "succeeded"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}>
              <CreditCard size={16} className="ml-2" />
              {payment?.status === "succeeded" ? "دفع ناجح" : "بانتظار الدفع"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Order Breakdown) */}
        <div className="lg:col-span-2 space-y-8">
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">تقسيم الطلب على المتاجر</h2>

          {order.subOrders.map((subOrder) => (
            <div key={subOrder.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Store Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{subOrder.vendor.storeName}</h3>
                    <p className="text-sm text-slate-500">حالة التجهيز: 
                      <span className="font-medium text-slate-700 dark:text-slate-300 mr-1">
                        {subOrder.status === 'pending' ? 'قيد المراجعة' : 
                         subOrder.status === 'processing' ? 'قيد التجهيز' :
                         subOrder.status === 'shipped' ? 'تم الشحن' :
                         subOrder.status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {subOrder.items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                      ) : (
                        <Package className="absolute inset-0 m-auto text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-right">
                      <h4 className="font-medium text-slate-900 dark:text-white line-clamp-2">{item.product.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">الكمية: {item.quantity}</p>
                    </div>
                    <div className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap">
                      {Number(item.totalPrice).toLocaleString("ar-EG")} ج.م
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown for Admin */}
              <div className="bg-slate-50 dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  التفاصيل المالية للمتجر
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 font-medium mb-1">الإجمالي الفرعي</p>
                    <p className="font-bold text-slate-900 dark:text-white">{Number(subOrder.subtotal).toLocaleString("ar-EG")} ج.م</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-red-500 font-medium mb-1">عمولة المنصة ({Number(subOrder.commissionRateSnapshot)}%)</p>
                    <p className="font-bold text-red-600 dark:text-red-400">-{Number(subOrder.commissionAmount).toLocaleString("ar-EG")} ج.م</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">الصافي للمتجر</p>
                    <p className="font-bold text-xl text-indigo-700 dark:text-indigo-300">{Number(subOrder.vendorPayoutAmount).toLocaleString("ar-EG")} ج.م</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar (Customer Info & Total) */}
        <div className="space-y-6">
          
          {/* Order Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إجمالي الطلب</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>الإجمالي الفرعي للطلبات</span>
                <span>{Number(order.totalAmount).toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>الشحن</span>
                <span>مجاني</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-white">الإجمالي النهائي</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {Number(order.totalAmount).toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-slate-400" />
              بيانات العميل
            </h2>
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-white">{order.user.name}</p>
              <p className="text-sm text-slate-500">{order.user.email}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-slate-400" />
              عنوان الشحن
            </h2>
            {shippingAddress ? (
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p className="font-medium text-slate-900 dark:text-white">{shippingAddress.fullName}</p>
                <p>{shippingAddress.streetAddress}</p>
                {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                <p>{shippingAddress.city}، {shippingAddress.state}</p>
                <p>هاتف: <span className="font-medium">{shippingAddress.phone}</span></p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">لا يوجد عنوان شحن مسجل</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
