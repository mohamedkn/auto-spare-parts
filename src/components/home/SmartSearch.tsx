"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Package, Search } from "lucide-react";

interface SearchProduct {
  id: string;
  name: string;
  price: number | string;
  oemNumber?: string | null;
  brand?: string | null;
  images: { url: string }[];
  vendor?: { storeName: string };
}

export function SmartSearch({ isHeader = false }: { isHeader?: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const search = query.trim();
    if (!search) return;
    setLoading(true);
    setOpen(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(search)}&sortBy=relevance&limit=8`);
      const payload = await response.json();
      setResults(payload.data?.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrapperRef} className={isHeader ? "relative w-full max-w-2xl" : "relative z-20 mx-auto mb-10 w-full max-w-4xl"} dir="rtl">
      <form onSubmit={handleSearch} className="flex items-center rounded-lg border border-zinc-200 bg-white p-1.5 shadow-sm">
        <Search size={20} className="mr-2 shrink-0 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={isHeader ? "اسم القطعة أو رقم OEM" : "مثال: تيل فرامل بوش صني 2020 أو 04465-02390"}
          className={`min-w-0 flex-1 bg-transparent px-3 text-zinc-950 outline-none placeholder:text-zinc-400 ${isHeader ? "py-1.5 text-sm" : "py-3 text-base"}`}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex h-10 items-center justify-center rounded-md bg-amber-400 px-4 font-black text-zinc-950 disabled:opacity-50"
          aria-label="بحث"
        >
          {loading ? <Loader2 size={19} className="animate-spin" /> : <Search size={19} />}
        </button>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-zinc-500">
              <Loader2 size={20} className="animate-spin" /> جارٍ ترتيب أفضل النتائج...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-50"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                      {product.images[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill sizes="56px" className="object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package size={20} className="text-zinc-400" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-zinc-900">{product.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {[product.brand, product.oemNumber ? `OEM: ${product.oemNumber}` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <strong className="text-sm text-zinc-950">{Number(product.price).toLocaleString("ar-EG")} ج.م</strong>
                  </Link>
                ))}
              </div>
              <Link
                href={`/products?search=${encodeURIComponent(query.trim())}&sortBy=relevance`}
                onClick={() => setOpen(false)}
                className="block border-t border-zinc-200 bg-zinc-950 px-4 py-3 text-center text-sm font-black text-white"
              >
                عرض كل النتائج
              </Link>
            </>
          ) : (
            <div className="px-5 py-9 text-center">
              <Package size={32} className="mx-auto text-zinc-300" />
              <p className="mt-3 font-black text-zinc-900">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-xs text-zinc-500">جرّب رقم OEM أو اسمًا أقصر للقطعة.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
