"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface ProductCarouselProps {
  products: any[];
  title?: string;
}

export function ProductCarousel({ products, title }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.clientWidth * 0.8; // scroll by 80% of width
      if (direction === "right") {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative w-full py-6">
      {title && (
        <div className="flex justify-between items-center mb-4 px-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
      )}
      
      {/* Navigation Buttons */}
      <button 
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 shadow-md p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-primary transition-all -mr-4 lg:-mr-6 border border-slate-200 dark:border-slate-700 focus:outline-none hidden sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>
      
      <button 
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 shadow-md p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-primary transition-all -ml-4 lg:-ml-6 border border-slate-200 dark:border-slate-700 focus:outline-none hidden sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[200px] sm:min-w-[240px] max-w-[280px] flex-shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
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
