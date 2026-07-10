import Link from "next/link";
import Image from "next/image";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { ArrowLeft } from "lucide-react";

interface SubCategorySectionProps {
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    products: any[];
  };
}

export function SubCategorySection({ category }: SubCategorySectionProps) {
  // We only show the section if it has products or if it's meant to be a placeholder
  if (!category.products || category.products.length === 0) return null;

  return (
    <div id={`section-${category.slug}`} className="mb-16 pt-8">
      {/* Title with decoration */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="h-1 w-12 bg-yellow-500 rounded-full hidden md:block"></div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
          {category.name}
        </h2>
        <div className="h-1 w-12 bg-yellow-500 rounded-full hidden md:block"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Featured Block */}
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <Link href={`/products?categoryId=${category.id}`} className="block group h-full">
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl overflow-hidden h-[300px] lg:h-full relative shadow-sm flex flex-col items-center justify-center p-6 border border-slate-800">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500 to-transparent group-hover:opacity-40 transition-opacity duration-500"></div>
              
              {category.imageUrl ? (
                <div className="relative w-48 h-48 mb-4 transform group-hover:scale-110 transition-transform duration-500 z-10">
                  <Image src={category.imageUrl} alt={category.name} fill className="object-contain drop-shadow-xl" />
                </div>
              ) : (
                <div className="w-48 h-48 mb-4 flex items-center justify-center z-10">
                  {/* Default fallback if no image */}
                  <span className="text-6xl text-yellow-500 font-bold opacity-50">{category.name[0]}</span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white z-10 text-center mb-4">{category.name}</h3>
              
              <div className="inline-flex items-center gap-2 bg-yellow-500 text-slate-900 px-6 py-2 rounded-full font-bold text-sm z-10 group-hover:bg-yellow-400 transition-colors">
                عرض كل الأجهزة
                <ArrowLeft size={16} />
              </div>
            </div>
          </Link>
        </div>

        {/* Products Carousel */}
        <div className="w-full lg:w-2/3 xl:w-3/4 bg-white dark:bg-slate-900 rounded-3xl p-2 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <ProductCarousel products={category.products} title={`الأكثر مبيعاً في ${category.name}`} />
        </div>
      </div>
    </div>
  );
}
