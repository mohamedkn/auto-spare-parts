import Link from "next/link";
import { Store, Star } from "lucide-react";
import Image from "next/image";

// Fetch vendors from the internal API
async function getVendors() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/vendors?limit=50`, {
      cache: "no-store",
    });
    if (!res.ok) return { vendors: [] };
    const data = await res.json();
    return data.data || { vendors: [] };
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return { vendors: [] };
  }
}

export const metadata = {
  title: "التجار | AutoParts",
  description: "تصفح أفضل التجار المعتمدين لقطع غيار السيارات",
};

export default async function VendorsPage() {
  const { vendors } = await getVendors();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">التجار المعتمدون</h1>
        <p className="text-slate-600 dark:text-slate-400">تصفح وتسوق من أفضل المتاجر المتخصصة في قطع الغيار</p>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Store className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا يوجد تجار حالياً</h3>
          <p className="text-slate-500">جاري إضافة المزيد من التجار المعتمدين لمنصتنا.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {vendors.map((vendor: any) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300"
            >
              {/* Vendor Cover/Logo Area */}
              <div className="h-32 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                {vendor.logoUrl ? (
                  <Image
                    src={vendor.logoUrl}
                    alt={vendor.storeName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Store className="w-12 h-12 text-slate-400" />
                )}
              </div>

              {/* Vendor Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                  {vendor.storeName}
                </h3>
                
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : "جديد"}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({vendor.reviewsCount || 0} تقييم)
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {vendor.description || "متجر معتمد لبيع قطع غيار السيارات."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
