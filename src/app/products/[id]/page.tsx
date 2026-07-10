import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Store, Package, ChevronLeft } from "lucide-react";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { WishlistButton } from "@/components/products/WishlistButton";
import { getUserSession } from "@/lib/auth/session";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      vendor: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          avgRating: true,
          reviewsCount: true,
          _count: { select: { products: true } },
        },
      },
      category: { select: { id: true, name: true } },
      reviews: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product || product.status === "draft") {
    notFound();
  }

  // Check if vendor is approved
  const vendor = await prisma.vendor.findUnique({
    where: { id: product.vendorId },
    select: { status: true },
  });
  if (vendor?.status !== "approved") notFound();

  const session = await getUserSession();

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  const totalReviews = product._count.reviews;

  // Related products (same category, different id)
  const relatedProducts = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          status: "active",
          vendor: { status: "approved" },
        },
        include: {
          images: { take: 1, select: { url: true } },
        },
        take: 4,
      })
    : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/products" className="hover:text-indigo-600 transition-colors">المنتجات</Link>
        {product.category && (
          <>
            <ChevronLeft size={14} />
            <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-indigo-600 transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronLeft size={14} />
        <span className="text-slate-900 dark:text-white line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <Package size={64} />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <div
                  key={img.id}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer ${i === 0 ? "border-primary" : "border-slate-200 dark:border-slate-700 hover:border-primary"} transition-colors`}
                >
                  <Image src={img.url} alt={`${product.name} ${i + 1}`} fill sizes="64px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div>
            {product.category && (
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="text-xs font-semibold text-primary uppercase tracking-wider hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-amber-500">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-slate-500">({totalReviews} تقييم)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">
              {Number(product.price).toLocaleString("ar-EG")}
            </span>
            <span className="text-xl text-slate-500 pb-0.5">ج.م</span>
          </div>

          {/* Stock status */}
          <div>
            {product.stockQuantity > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                متوفر ({product.stockQuantity} في المخزون)
              </span>
            ) : (
              <span className="text-sm font-semibold text-red-500">نفذ من المخزون</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <AddToCartButton
              productId={product.id}
              isLoggedIn={!!session}
              inStock={product.stockQuantity > 0}
            />
            <WishlistButton
              productId={product.id}
              isLoggedIn={!!session}
            />
          </div>

          {/* Seller info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
              <Store size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-0.5">البائع</p>
              <p className="font-bold text-slate-900 dark:text-white">{product.vendor.storeName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{product.vendor._count.products} منتج</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white mb-2">وصف المنتج</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              تقييمات العملاء
            </h2>
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-amber-600 dark:text-amber-400">{avgRating.toFixed(1)}</span>
              <span className="text-slate-500 text-sm">من 5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{review.user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            منتجات مشابهة
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Package size={32} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-2 text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                    {p.name}
                  </p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {Number(p.price).toLocaleString("ar-EG")} ج.م
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
