import Image from "next/image";

interface CategoryBannerProps {
  imageUrl?: string | null;
  title: string;
}

export function CategoryBanner({ imageUrl, title }: CategoryBannerProps) {
  if (imageUrl) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <Image 
          src={imageUrl} 
          alt={title} 
          fill 
          className="object-cover"
          priority
        />
      </div>
    );
  }

  // Fallback to stylized banner with brand colors (Black, Gold, White)
  return (
    <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden mb-8 shadow-sm bg-gradient-to-r from-slate-900 via-slate-800 to-black flex items-center justify-center text-center px-4">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent pointer-events-none"></div>
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 drop-shadow-sm">
          {title}
        </h1>
        <p className="text-white/80 md:text-lg max-w-2xl">
          تسوق أحدث المنتجات من قسم {title} بأسعار لا تقبل المنافسة
        </p>
      </div>
    </div>
  );
}
