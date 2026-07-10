import { notFound } from "next/navigation";
import Image from "next/image";
import { Store, Star, Package } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";

// Fetch vendor details
async function getVendorDetails(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/vendors/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.vendor || null;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }
}

// Fetch vendor products
async function getVendorProducts(vendorId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/products?vendorId=${vendorId}&limit=50`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.products || [];
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const vendor = await getVendorDetails(resolvedParams.id);
  
  if (!vendor) return { title: "التاجر غير موجود | AutoParts" };
  
  return {
    title: `${vendor.storeName} | AutoParts`,
    description: vendor.description || `تصفح منتجات ${vendor.storeName}`,
  };
}

export default async function VendorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const vendor = await getVendorDetails(resolvedParams.id);

  if (!vendor) {
    notFound();
  }

  const products = await getVendorProducts(resolvedParams.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Vendor Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-10 shadow-sm">
        {/* Cover Photo Area */}
        <div className="h-48 md:h-64 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
           {vendor.logoUrl ? (
             <Image
               src={vendor.logoUrl}
               alt={vendor.storeName}
               fill
               className="object-cover"
             />
           ) : (
             <Store className="w-24 h-24 text-slate-300 dark:text-slate-600" />
           )}
        </div>
        
        {/* Vendor Info Section */}
        <div className="relative px-6 pb-6 pt-16 sm:pt-6 sm:px-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Vendor Logo (Overlapping Cover) */}
            <div className="absolute -top-16 sm:relative sm:top-0 w-32 h-32 rounded-2xl bg-white dark:bg-slate-950 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden z-20 shrink-0">
              {vendor.logoUrl ? (
                <Image
                  src={vendor.logoUrl}
                  alt={vendor.storeName}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-12 h-12 text-slate-400" />
              )}
            </div>

            {/* Vendor Text Details */}
            <div className="flex-1 text-center sm:text-right mt-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                {vendor.storeName}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : "جديد"}</span>
                  <span className="opacity-70">({vendor.reviewsCount || 0} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  <Package className="w-4 h-4" />
                  <span>{products.length} منتج</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  <Store className="w-4 h-4" />
                  <span>عضو منذ {new Date(vendor.createdAt).toLocaleDateString("ar-EG", { month: "short", year: "numeric" })}</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
                {vendor.description || "متجر معتمد لبيع قطع غيار السيارات."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Products */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          منتجات التاجر
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Package className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد منتجات حالياً</h3>
            <p className="text-slate-500">هذا التاجر لم يقم بإضافة أي منتجات بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
