import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { OrderActions } from "@/components/vendor/OrderActions";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> قيد المراجعة</span>;
    case "preparing":
      return <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Package size={12}/> جاري التجهيز</span>;
    case "processing":
      return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Truck size={12}/> جاري البحث عن مندوب</span>;
    case "confirmed":
      return <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> مؤكد</span>;
    case "shipped":
      return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Truck size={12}/> جاري التوصيل</span>;
    case "delivered":
      return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> تم التوصيل</span>;
    case "cancelled":
      return <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">مرفوض</span>;
    default:
      return <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-medium">{status}</span>;
  }
};

export default async function VendorOrdersPage() {
  const session = await getUserSession();
  if (!session) return redirect("/login");
  
  const vendor = await prisma.vendor.findUnique({
    where: { ownerId: session.userId },
  });

  if (!vendor) return redirect("/");

  const orders = await prisma.subOrder.findMany({
    where: { vendorId: vendor.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          shippingAddress: true,
          user: { select: { name: true, phone: true } },
        },
      },
      items: {
        include: {
          product: { select: { name: true, images: true } },
        },
      },
      deliveryJob: {
        include: {
          driver: {
            include: {
              user: { select: { name: true, phone: true } }
            }
          }
        }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">طلبات العملاء</h1>
          <p className="text-slate-500">إدارة الطلبات الواردة وتحديث حالة الشحن</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {orders.map((subOrder) => {
          const address = subOrder.order.shippingAddress as any;
          
          return (
            <div key={subOrder.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="bg-slate-50 dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">رقم الطلب</p>
                    <p className="font-bold text-slate-900 dark:text-white">{subOrder.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">التاريخ</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{new Date(subOrder.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">الإجمالي</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{Number(subOrder.subtotal)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">عمولة ({Number(subOrder.commissionRateSnapshot)}%)</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-500">-{Number(subOrder.commissionAmount)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">الصافي لك</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{Number(subOrder.vendorPayoutAmount)} ج.م</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {subOrder.deliveryJob?.driver?.user && (
                    <div className="text-right ml-4 border-l border-slate-200 dark:border-slate-800 pl-4">
                      <p className="text-xs text-slate-500 font-medium mb-1">المندوب: {subOrder.deliveryJob.driver.user.name}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white" dir="ltr">{subOrder.deliveryJob.driver.user.phone || 'غير متاح'}</p>
                    </div>
                  )}
                  {getStatusBadge(subOrder.status)}
                  <OrderActions subOrder={{
                    id: subOrder.id,
                    status: subOrder.status,
                    deliveryJob: subOrder.deliveryJob ? { pickupOtp: subOrder.deliveryJob.pickupOtp } : null
                  }} />
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col md:flex-row gap-8">
                {/* Items */}
                <div className="flex-1 space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">عناصر الطلب ({subOrder.items.length})</h4>
                  {subOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        {item.product.images[0]?.url ? (
                          <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <Package className="absolute inset-0 m-auto text-slate-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">الكمية: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {Number(item.totalPrice)} ج.م
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Details */}
                <div className="w-full md:w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">بيانات العميل والشحن</h4>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-900 dark:text-white">{address.fullName || subOrder.order.user.name}</p>
                    <p dir="ltr" className="text-right">{address.phone || subOrder.order.user.phone}</p>
                    <div className="pt-2">
                      <p>{address.streetAddress}</p>
                      <p>{address.city}، {address.governorate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="bg-white dark:bg-slate-950 p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg text-slate-500">لا توجد طلبات حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
