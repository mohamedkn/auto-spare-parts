"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

export function OrdersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") || "");
  const [dateRange, setDateRange] = useState(searchParams.get("dateRange") || "");

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalizedSearch = search.trim();
      if (normalizedSearch) {
        params.set("q", normalizedSearch);
      } else {
        params.delete("q");
      }
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, router, searchParams]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("paymentStatus", status);
    } else {
      params.delete("paymentStatus");
    }
    setPaymentStatus(status);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleDateRangeChange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range) {
      params.set("dateRange", range);
    } else {
      params.delete("dateRange");
    }
    setDateRange(range);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentStatus("");
    setDateRange("");
    router.replace("?", { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="relative w-full max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب..."
            className="block w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-3 pl-4 pr-11 text-sm leading-5 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400/60 focus:ring-4 focus:ring-amber-400/10"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-colors ${showFilters || paymentStatus || dateRange ? 'border-amber-400/40 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'}`}
        >
          <Filter size={18} />
          فلترة
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/55 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">الفترة:</span>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
            >
              <option value="">كل الأوقات</option>
              <option value="today">اليوم</option>
              <option value="this_month">هذا الشهر</option>
              <option value="this_year">هذا العام</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">حالة الدفع:</span>
            <select
              value={paymentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
            >
              <option value="">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="succeeded">ناجح</option>
              <option value="failed">فشل</option>
            </select>
          </div>
          
          {(search || paymentStatus || dateRange) && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 mr-auto bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X size={14} />
              مسح الفلاتر
            </button>
          )}
        </div>
      )}
    </div>
  );
}
