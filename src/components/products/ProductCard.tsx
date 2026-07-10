import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: any;
    avgRating?: number;
    reviewsCount?: number;
    images: { url: string }[];
    vendor?: { storeName: string };
    stockQuantity: number;
  };
  isLoggedIn?: boolean; // Ideally passed down from context, but defaulting to true for mock if not provided
}

export function ProductCard({ product, isLoggedIn = true }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url || "";

  return (
    <div className="group flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 relative h-full">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-white dark:bg-zinc-900 p-4">
        <Link href={`/products/${product.id}`} className="block w-full h-full relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">بدون صورة</div>
          )}
        </Link>
        
        {/* OEM/Original Badge */}
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm border border-zinc-700">
            أصلي OEM
          </div>
        </div>

        {/* Floating Add to Cart (+) Button */}
        <div className="absolute bottom-2 left-2 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <AddToCartButton
            productId={product.id}
            isLoggedIn={isLoggedIn}
            inStock={product.stockQuantity > 0}
            variant="circle"
          />
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link href={`/products/${product.id}`} className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:text-primary transition-colors mb-2 min-h-[40px]">
          {product.name}
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs text-primary mb-3">
          <span>★</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">{product.avgRating || "0.0"}</span>
          <span className="text-zinc-400 dark:text-zinc-500">
            ({product.reviewsCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-black dark:text-white leading-none">
              {Number(product.price).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">ج.م</span>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            متوفر
          </div>
        </div>
      </div>
    </div>
  );
}
