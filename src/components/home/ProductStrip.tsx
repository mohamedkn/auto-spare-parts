import Link from "next/link";
import { ProductCard } from "../products/ProductCard";
import { Prisma } from "@prisma/client";

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { images: { take: 1; select: { url: true } } };
}>;

interface ProductStripProps {
  title: string;
  products: ProductWithDetails[];
  viewAllLink?: string;
}

export function ProductStrip({ title, products, viewAllLink }: ProductStripProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-bold text-black dark:text-white">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-primary hover:text-yellow-600 font-bold text-sm bg-white border border-zinc-200 px-4 py-1.5 rounded-sm transition-colors">
            عرض الكل
          </Link>
        )}
      </div>
      
      <div className="relative">
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x px-2">
          {products.map((product) => (
            <div key={product.id} className="min-w-[200px] max-w-[200px] sm:min-w-[220px] sm:max-w-[220px] shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
