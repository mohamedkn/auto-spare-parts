import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductActions } from "./ProductActions";

export default async function VendorProductsPage({ searchParams }: PageProps<"/vendor/products">) {
  const session = await getUserSession();
  const filters = await searchParams;
  const query = typeof filters.q === "string" ? filters.q.trim() : "";
  
  if (!session) return redirect("/login");

  const vendor = await prisma.vendor.findUnique({
    where: { ownerId: session.userId },
  });

  if (!vendor) return redirect("/");

  const products = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      isPrivate: false,
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { oemNumber: { contains: query, mode: "insensitive" as const } },
        ],
      } : {}),
    },
    include: {
      category: { select: { name: true } },
      images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المنتجات</h1>
          <p className="text-slate-500">إدارة منتجات متجرك وأسعارها</p>
        </div>
        <Link href="/vendor/products/new" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={20} />
          إضافة منتج جديد
        </Link>
      </div>

      <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-sm border-b border-slate-200/50 dark:border-slate-800/50">
              <tr>
                <th className="p-4 font-medium">المنتج</th>
                <th className="p-4 font-medium">السعر</th>
                <th className="p-4 font-medium">المخزون</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">الفئة</th>
                <th className="p-4 font-medium w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 relative overflow-hidden flex-shrink-0">
                        {product.images[0]?.url ? (
                          <Image src={product.images[0].url} alt={product.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">بدون</span>
                        )}
                      </div>
                      <Link href={`/products/${product.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{Number(product.price)} ج.م</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.stockQuantity > 10 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : product.stockQuantity > 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {product.stockQuantity > 0 ? `${product.stockQuantity} قطعة` : "نفذ المخزون"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {product.status === "active" ? "نشط" : "مسودة"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{product.category?.name || "بدون فئة"}</td>
                  <td className="p-4">
                    <ProductActions productId={product.id} />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    {query ? `لا توجد منتجات مطابقة لعبارة «${query}».` : "لم تقم بإضافة أي منتجات حتى الآن."}
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
