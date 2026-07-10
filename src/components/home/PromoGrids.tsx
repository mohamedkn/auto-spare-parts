import Link from "next/link";
import Image from "next/image";

export function PromoGrids() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      {/* Mega Deal */}
      <Link href="/products?discount=true" className="group relative rounded-2xl overflow-hidden aspect-[2/1] bg-zinc-900 border border-zinc-800 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black p-8 flex flex-col justify-center z-10">
          <h3 className="text-primary text-3xl font-black mb-2 tracking-tight">عروض الصيانة</h3>
          <p className="text-zinc-300 text-lg">خصومات تصل إلى 40% على فلاتر الزيت والفرامل</p>
          <div className="mt-6 px-6 py-2.5 bg-primary text-black font-bold w-max rounded-xl text-sm group-hover:scale-105 transition-transform flex items-center gap-2">
            تسوق الآن &larr;
          </div>
        </div>
      </Link>
      
      {/* Best Sellers */}
      <Link href="/products?sort=popular" className="group relative rounded-2xl overflow-hidden aspect-[2/1] bg-black border border-zinc-800 hover:border-zinc-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-black p-8 flex flex-col justify-center z-10">
          <h3 className="text-white text-3xl font-black mb-2 tracking-tight">الأعلى مبيعاً</h3>
          <p className="text-zinc-400 text-lg">اكتشف القطع الأكثر طلباً للسيارات الكورية واليابانية</p>
          <div className="mt-6 px-6 py-2.5 bg-white text-black font-bold w-max rounded-xl text-sm group-hover:scale-105 transition-transform flex items-center gap-2">
            تصفح القائمة &larr;
          </div>
        </div>
      </Link>
    </div>
  );
}
