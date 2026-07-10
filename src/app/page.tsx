import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headphones, PackageCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PromoGrids } from "@/components/home/PromoGrids";
import { ProductStrip } from "@/components/home/ProductStrip";
import { VehicleSearchWidget } from "@/components/home/VehicleSearchWidget";

export const revalidate = 60;

export default async function Home() {
  const categoriesPromise = prisma.category.findMany({
    where: { parentId: null, slug: { not: "uncategorized" } },
    take: 8,
  });
  const featuredPromise = prisma.product.findMany({
    where: { status: "active", vendor: { status: "approved" } },
    include: { images: { take: 1, select: { url: true } } },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  const getBestSellers = async () => {
    try {
      const topItems = await prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      });
      if (topItems.length) {
        const fetchedProducts = await prisma.product.findMany({
          where: { id: { in: topItems.map((item) => item.productId) }, status: "active", vendor: { status: "approved" } },
          include: { images: { take: 1, select: { url: true } } },
        });
        const sorted = topItems.map((item) => fetchedProducts.find((product) => product.id === item.productId)).filter((product): product is NonNullable<typeof product> => Boolean(product));
        if (sorted.length) return sorted;
      }
      return prisma.product.findMany({
        where: { status: "active", vendor: { status: "approved" } },
        include: { images: { take: 1, select: { url: true } } },
        take: 10,
        orderBy: { createdAt: "asc" },
      });
    } catch {
      return [];
    }
  };

  const [categories, featuredProducts, bestSellers] = await Promise.all([categoriesPromise, featuredPromise, getBestSellers()]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-10 dark:bg-zinc-950">
      <HeroSlider />

      <div className="container relative z-10 mx-auto -mt-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/90 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-400">ابحث حسب سيارتك</p>
              <h2 className="mt-1 text-lg font-black text-white sm:text-2xl">القطعة الصحيحة من أول مرة</h2>
            </div>
            <BadgeCheck className="hidden text-amber-400 sm:block" size={34} />
          </div>
          <VehicleSearchWidget />
        </div>
      </div>

      <div className="container mx-auto mt-8 space-y-12 px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="مزايا المتجر">
          {[
            { icon: PackageCheck, title: "توافق موثّق", text: "حسب الماركة والموديل" },
            { icon: BadgeCheck, title: "تجار معتمدون", text: "متاجر تمت مراجعتها" },
            { icon: Truck, title: "توصيل متتبع", text: "اعرف حالة طلبك" },
            { icon: Headphones, title: "دعم حقيقي", text: "معك قبل وبعد الشراء" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-500"><Icon size={20} /></span>
              <span><strong className="block text-sm text-zinc-900 dark:text-white">{title}</strong><span className="text-xs text-zinc-500">{text}</span></span>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-white"><span className="h-6 w-1.5 rounded-full bg-primary" />تصفح الأقسام</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/products?categoryId=${category.id}`} className={`group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 ${index === 0 || index === 3 ? "aspect-square md:col-span-2 md:row-span-2 md:aspect-auto" : "aspect-square"}`}>
                {category.imageUrl && (
                  <div className="absolute inset-0">
                    <Image src={category.imageUrl} alt={category.name} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-110 dark:opacity-45" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>
                )}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-white transition-colors group-hover:text-primary sm:text-xl">{category.name}</h3>
                  <p className="mt-1 translate-y-2 text-sm text-zinc-300 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">تصفح القطع &larr;</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <PromoGrids />
        <ProductStrip title="وصل حديثًا" products={featuredProducts} viewAllLink="/products?sort=newest" />
        <ProductStrip title="الأعلى مبيعًا" products={bestSellers} viewAllLink="/products?sort=popular" />
      </div>
    </div>
  );
}
