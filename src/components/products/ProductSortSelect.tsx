"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductSortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sortBy", event.target.value);
        params.delete("page");
        router.push(`/products?${params.toString()}`);
      }}
      className="h-11 rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm font-bold text-zinc-200 outline-none transition focus:border-amber-400/60"
      aria-label="ترتيب المنتجات"
    >
      <option value="relevance">الأكثر صلة</option>
      <option value="newest">الأحدث</option>
      <option value="price_asc">السعر: الأقل أولًا</option>
      <option value="price_desc">السعر: الأعلى أولًا</option>
      <option value="rating_desc">الأعلى تقييمًا</option>
    </select>
  );
}
