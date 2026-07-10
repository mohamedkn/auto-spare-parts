"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface FiltersSidebarProps {
  categories: Category[];
  brands: string[];
}

const CONDITIONS = [
  ["new_original", "أصلي جديد"],
  ["new_aftermarket", "بديل جديد"],
  ["used", "استيراد / مستعمل"],
  ["refurbished", "مجدّد"],
] as const;

export function FiltersSidebar({ categories, brands }: FiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const currentCategory = searchParams.get("categoryId") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentCondition = searchParams.get("condition") || "";
  const minRating = searchParams.get("minRating") || "";
  const inStock = searchParams.get("inStock") === "true";
  const hasActiveFilters = [currentCategory, currentBrand, currentCondition, minRating, minPrice, maxPrice].some(Boolean) || inStock;

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["categoryId", "brand", "condition", "minRating", "minPrice", "maxPrice", "inStock", "page"].forEach((key) => params.delete(key));
    setMinPrice("");
    setMaxPrice("");
    router.push(`/products${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="sticky top-24 space-y-6 rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white">تصفية النتائج</h3>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 transition hover:border-amber-400/30 hover:text-amber-300">
            <RotateCcw size={12} /> إعادة ضبط
          </button>
        )}
      </div>

      <section>
        <h4 className="mb-3 text-sm font-black text-zinc-200">التصنيف</h4>
        <div className="filter-scrollbar max-h-72 space-y-1.5 overflow-y-auto pl-2 pr-0.5">
          <FilterRadio label="كل التصنيفات" checked={!currentCategory} onChange={() => updateFilters({ categoryId: null })} />
          {categories.map((category) => (
            <div key={category.id}>
              <FilterRadio
                label={category.name}
                checked={currentCategory === category.id}
                onChange={() => updateFilters({ categoryId: category.id })}
              />
              {category.children?.map((child) => (
                <div key={child.id} className="mr-4 mt-1 border-r border-white/8 pr-2">
                  <FilterRadio
                    label={child.name}
                    checked={currentCategory === child.id}
                    onChange={() => updateFilters({ categoryId: child.id })}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-black text-zinc-200">السعر بالجنيه</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="من"
            className="min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-400/60"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="إلى"
            className="min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-400/60"
          />
        </div>
        <button
          onClick={() => updateFilters({ minPrice: minPrice || null, maxPrice: maxPrice || null })}
          className="mt-2 w-full rounded-xl bg-amber-400 py-2.5 text-xs font-black text-zinc-950 transition hover:bg-amber-300"
        >
          تطبيق السعر
        </button>
      </section>

      {brands.length > 0 && (
        <section>
          <h4 className="mb-3 text-sm font-black text-zinc-200">ماركة القطعة</h4>
          <select
            value={currentBrand}
            onChange={(event) => updateFilters({ brand: event.target.value || null })}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-amber-400/60"
          >
            <option value="">كل الماركات</option>
            {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        </section>
      )}

      <section>
        <h4 className="mb-3 text-sm font-black text-zinc-200">حالة القطعة</h4>
        <div className="space-y-2">
          <FilterRadio label="كل الحالات" checked={!currentCondition} onChange={() => updateFilters({ condition: null })} />
          {CONDITIONS.map(([value, label]) => (
            <FilterRadio
              key={value}
              label={label}
              checked={currentCondition === value}
              onChange={() => updateFilters({ condition: value })}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-black text-zinc-200">التقييم</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <FilterRadio
              key={rating}
              label={`${rating} نجوم فأكثر`}
              checked={minRating === String(rating)}
              onChange={() => updateFilters({ minRating: String(rating) })}
            />
          ))}
        </div>
      </section>

      <label className="flex cursor-pointer items-center gap-2 border-t border-white/10 pt-4 text-sm font-bold text-zinc-300">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => updateFilters({ inStock: event.target.checked ? "true" : null })}
          className="h-4 w-4 accent-amber-500"
        />
        متوفر في المخزون فقط
      </label>
    </div>
  );
}

function FilterRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition ${checked ? "bg-amber-400/10 font-bold text-amber-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded-full border transition ${checked ? "border-amber-400" : "border-zinc-600"}`}>
        {checked && <span className="size-2 rounded-full bg-amber-400" />}
      </span>
      <span className="min-w-0 leading-5">{label}</span>
    </label>
  );
}
