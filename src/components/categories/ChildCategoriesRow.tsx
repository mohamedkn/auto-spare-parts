"use client";

import Link from "next/link";
import Image from "next/image";
import { Layers } from "lucide-react";

interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface ChildCategoriesRowProps {
  categories: ChildCategory[];
}

export function ChildCategoriesRow({ categories }: ChildCategoriesRowProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full mb-12">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2 text-center md:text-right">
        تسوق حسب القسم
      </h2>
      
      <div 
        className="flex overflow-x-auto gap-4 md:gap-8 pb-4 px-2 snap-x snap-mandatory hide-scrollbar justify-start md:justify-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <Link 
            key={cat.id} 
            href={`#section-${cat.slug}`}
            className="flex flex-col items-center gap-3 min-w-[100px] snap-center group"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 border-2 border-transparent group-hover:border-yellow-500 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300">
              {cat.imageUrl ? (
                <Image 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  width={80} 
                  height={80} 
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <Layers className="text-slate-400 group-hover:text-yellow-500 transition-colors" size={32} />
              )}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
