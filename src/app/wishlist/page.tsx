import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/auth/session";
import { ProductCard } from "@/components/products/ProductCard";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          vendor: { select: { storeName: true } },
          images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
          reviews: { select: { rating: true } },
          stockQuantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedProducts = wishlistItems.map((item) => {
    const product = item.product;
    const totalReviews = product.reviews.length;
    const avgRating = totalReviews > 0 ? product.reviews.reduce((s, r) => s + r.rating, 0) / totalReviews : 0;
    return {
      ...product,
      price: Number(product.price),
      avgRating: Number(avgRating.toFixed(2)),
      reviewsCount: totalReviews,
      stockQuantity: product.stockQuantity,
    };
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">المفضلة</h1>
        <p className="text-slate-500 mt-2">
          لديك {wishlistItems.length} منتج في قائمتك
        </p>
      </div>

      {formattedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {formattedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-6 opacity-30 text-indigo-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">قائمتك فارغة</h3>
          <p>لم تقم بإضافة أي منتجات إلى المفضلة بعد.</p>
        </div>
      )}
    </div>
  );
}
