import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Plus, CheckCircle2, Trash2, ChevronLeft } from "lucide-react";

export default async function AddressesPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.userId },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">عناويني</h1>
          <p className="text-slate-500 mt-1">إدارة عناوين الشحن الخاصة بك</p>
        </div>
        <Link href="/profile/addresses/new" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow">
          <Plus size={20} />
          إضافة عنوان جديد
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`relative p-6 rounded-2xl border-2 transition-all ${
              address.isDefault
                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800"
            }`}
          >
            {address.isDefault && (
              <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <CheckCircle2 size={14} />
                الافتراضي
              </span>
            )}

            <div className="flex items-start gap-4 mb-4 pr-2">
              <div className={`p-3 rounded-full ${address.isDefault ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{address.fullName}</h3>
                {address.label && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{address.label}</span>
                )}
                <p className="text-slate-500 text-sm mt-1" dir="ltr">{address.phone}</p>
              </div>
            </div>

            <div className="space-y-1 text-slate-600 dark:text-slate-300 text-sm mb-6">
              <p>{address.streetAddress}</p>
              {address.buildingApartment && <p>{address.buildingApartment}</p>}
              <p>{address.city}، {address.governorate}</p>
              {address.landmark && <p className="text-slate-400 text-xs">قريب من: {address.landmark}</p>}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              {!address.isDefault && (
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  تعيين كافتراضي
                </button>
              )}
              <div className="flex-1"></div>
              <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <MapPin size={48} className="mb-4 opacity-30 text-indigo-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">لا توجد عناوين</h3>
            <p>قم بإضافة عنوانك الأول لسهولة وسرعة إتمام الطلبات.</p>
          </div>
        )}
      </div>
    </div>
  );
}
