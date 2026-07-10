import Link from "next/link";
import { ProductCondition, Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import { FiltersSidebar } from "@/components/products/FiltersSidebar";
import { ProductSortSelect } from "@/components/products/ProductSortSelect";
import { VehicleSearchWidget } from "@/components/home/VehicleSearchWidget";
import { prisma } from "@/lib/db";
import { buildProductWhere, inferVehicleFilters, scoreProductRelevance } from "@/lib/search/product-search";

type SearchParams = { [key: string]: string | string[] | undefined };

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pageLink(params: SearchParams, page: number): string {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const first = valueOf(value);
    if (first) next.set(key, first);
  });
  next.set("page", String(page));
  return `/products?${next.toString()}`;
}

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stockQuantity: true,
  oemNumber: true,
  partNumber: true,
  brand: true,
  createdAt: true,
  vendor: { select: { storeName: true } },
  category: { select: { name: true, slug: true } },
  images: { select: { url: true }, take: 1, orderBy: { position: "asc" as const } },
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductSelect;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = valueOf(params.search)?.trim();
  const categoryId = valueOf(params.categoryId);
  const brand = valueOf(params.brand);
  const condition = valueOf(params.condition) as ProductCondition | undefined;
  const inStock = valueOf(params.inStock) as "true" | "false" | undefined;
  const vehicleMakeId = valueOf(params.vehicleMakeId);
  const vehicleModelId = valueOf(params.vehicleModelId);
  const year = Number(valueOf(params.year)) || undefined;
  const minPrice = Number(valueOf(params.minPrice)) || undefined;
  const maxPrice = Number(valueOf(params.maxPrice)) || undefined;
  const minRating = Number(valueOf(params.minRating)) || undefined;
  const requestedSort = valueOf(params.sortBy);
  const sortBy = requestedSort || (search ? "relevance" : "newest");
  const page = Math.max(1, Number(valueOf(params.page)) || 1);
  const limit = 12;

  const [categories, brandRows, vehicleCatalog] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        children: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { status: "active", brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    search
      ? prisma.vehicleMake.findMany({
          select: { id: true, name: true, models: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const brands = brandRows.map((row) => row.brand).filter((item): item is string => Boolean(item));

  let productIdsFromRating: string[] | undefined;
  if (minRating) {
    const rows = await prisma.$queryRaw<Array<{ product_id: string }>>`
      SELECT "product_id" FROM "reviews"
      GROUP BY "product_id" HAVING AVG("rating") >= ${minRating}
    `;
    productIdsFromRating = rows.map((row) => row.product_id);
  }

  const inferredVehicle = search ? inferVehicleFilters(search, vehicleCatalog) : null;
  const where = buildProductWhere({
    search,
    categoryId,
    brand,
    condition,
    inStock,
    vehicleMakeId: vehicleMakeId || inferredVehicle?.vehicleMakeId,
    vehicleModelId: vehicleModelId || inferredVehicle?.vehicleModelId,
    year: year || inferredVehicle?.year,
    minPrice,
    maxPrice,
    productIdsFromRating,
  });
  const relevanceMode = Boolean(search && sortBy === "relevance");
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "price_asc" ? { price: "asc" }
      : sortBy === "price_desc" ? { price: "desc" }
        : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy,
      skip: relevanceMode ? 0 : (page - 1) * limit,
      take: relevanceMode ? 1000 : limit,
    }),
    prisma.product.count({ where }),
  ]);

  let products = rows.map((product) => {
    const reviewsCount = product.reviews.length;
    const avgRating = reviewsCount
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
      : 0;
    return { ...product, avgRating: Number(avgRating.toFixed(2)), reviewsCount, reviews: undefined };
  });

  if (relevanceMode && search) {
    products = products
      .map((product) => ({ ...product, relevanceScore: scoreProductRelevance(product, search) }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore || b.avgRating - a.avgRating)
      .slice((page - 1) * limit, page * limit);
  } else if (sortBy === "rating_desc") {
    products.sort((a, b) => b.avgRating - a.avgRating);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="container mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-l from-amber-400/[0.08] via-zinc-900 to-zinc-950 p-6 text-white shadow-2xl shadow-black/20 sm:p-8">
        <div className="absolute -left-20 -top-24 size-56 rounded-full bg-amber-400/10 blur-3xl" />
        <h1 className="relative text-2xl font-black sm:text-3xl">ابحث عن القطعة المناسبة بدقة</h1>
        <p className="mt-1 text-sm text-zinc-400">استخدم اسم القطعة أو الماركة أو رقم OEM، ثم حدّد سيارتك.</p>
        <form action="/products" className="relative mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={19} />
            <input
              name="search"
              defaultValue={search}
              placeholder="مثال: تيل فرامل بوش صني 2020 أو 04465-02390"
              className="h-14 w-full rounded-2xl border border-white/10 bg-zinc-950/70 pr-11 pl-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400/60 focus:ring-4 focus:ring-amber-400/10"
            />
          </div>
          <button className="h-14 rounded-2xl bg-amber-400 px-7 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-300">بحث</button>
        </form>
      </div>

      <VehicleSearchWidget />

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">{search ? `نتائج البحث عن “${search}”` : "كل المنتجات"}</h2>
          <p className="mt-1 text-sm text-zinc-500">تم العثور على {total} منتج</p>
          {!vehicleModelId && inferredVehicle?.modelName && (
            <p className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
              تم تطبيق توافق {inferredVehicle.makeName} {inferredVehicle.modelName}{inferredVehicle.year ? ` ${inferredVehicle.year}` : ""}
            </p>
          )}
        </div>
        <ProductSortSelect value={sortBy} />
      </div>

      <div className="flex flex-col gap-7 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <FiltersSidebar categories={categories} brands={brands} />
        </aside>

        <section className="min-w-0 flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-zinc-900/60 px-6 text-center">
              <Search size={38} className="text-zinc-600" />
              <h3 className="mt-4 font-black text-white">لم نجد منتجًا مطابقًا</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">جرّب مرادفًا مصريًا للقطعة، رقم OEM، أو أزل بعض الفلاتر.</p>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات النتائج">
              {page > 1 ? (
                <Link href={pageLink(params, page - 1)} className="flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm font-bold text-zinc-200 transition hover:border-amber-400/30 hover:text-amber-300"><ChevronRight size={16} /> السابق</Link>
              ) : (
                <span aria-disabled="true" className="flex h-11 cursor-not-allowed items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.025] px-4 text-sm font-bold text-zinc-700"><ChevronRight size={16} /> السابق</span>
              )}
              <span className="grid h-11 min-w-20 place-items-center rounded-xl border border-white/10 bg-zinc-900/70 px-3 text-sm font-black text-zinc-300">{page} من {totalPages}</span>
              {page < totalPages ? (
                <Link href={pageLink(params, page + 1)} className="flex h-11 items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/10 transition hover:bg-amber-300">التالي <ChevronLeft size={16} /></Link>
              ) : (
                <span aria-disabled="true" className="flex h-11 cursor-not-allowed items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.025] px-4 text-sm font-bold text-zinc-700">التالي <ChevronLeft size={16} /></span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
