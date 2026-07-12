"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  PackageSearch,
  RefreshCw,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Bid = {
  id: string;
  price: string;
  condition: string;
  notes?: string | null;
  status: string;
  vendor: {
    storeName: string;
    avgRating?: string | null;
    reviewsCount: number;
  };
};
type Inquiry = {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  bids: Bid[];
  acceptedBidId?: string | null;
  aiParsedData?: { partName?: string };
};
const statusLabel: Record<string, string> = {
  under_review: "قيد مراجعة الأدمن",
  open: "يستقبل عروضًا",
  bidding_closed: "انتهى التسعير",
  accepted: "تم اختيار عرض",
  cancelled: "ملغي",
  expired: "منتهي",
};
const conditionLabel: Record<string, string> = {
  new_original: "جديد أصلي",
  new_aftermarket: "جديد بديل",
  used: "مستعمل",
  refurbished: "مجدّد",
};

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/inquiries", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر التحميل");
      setItems(body.data.inquiries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 10_000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(id);
    };
  }, [load]);
  const accept = async (bidId: string) => {
    setActionId(bidId);
    try {
      const response = await fetch("/api/inquiries/accept-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر قبول العرض");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر قبول العرض");
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-zinc-950">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-600">سوق العروض</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">
              طلبات التسعير الخاصة بك
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void load()}
              className="rounded-xl border border-zinc-200 bg-white p-3 text-zinc-700"
            >
              <RefreshCw size={18} />
            </button>
            <Link
              href="/"
              className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white dark:bg-amber-400 dark:text-zinc-950"
            >
              طلب جديد
            </Link>
          </div>
        </div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="animate-spin text-amber-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white py-20 text-center">
            <PackageSearch className="mx-auto text-zinc-400" size={40} />
            <p className="mt-3 font-bold text-zinc-700">
              لم ترسل طلبات تسعير بعد
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <section
                key={item.id}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-white/10">
                  <div>
                    <h2 className="font-black text-zinc-950 dark:text-white">
                      {item.aiParsedData?.partName || item.description}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                    <Clock3 size={14} />
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="mb-3 text-sm font-black text-zinc-800 dark:text-zinc-200">
                    العروض ({item.bids.length})
                  </h3>
                  {item.bids.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {item.bids.map((bid) => (
                        <article
                          key={bid.id}
                          className={`rounded-2xl border p-4 ${item.acceptedBidId === bid.id ? "border-emerald-400 bg-emerald-50" : "border-zinc-200"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-bold">
                              <Store size={17} className="text-amber-600" />
                              {bid.vendor.storeName}
                            </span>
                            <strong className="text-xl text-zinc-950">
                              {Number(bid.price).toFixed(2)} ج.م
                            </strong>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">
                            {conditionLabel[bid.condition]}
                            {bid.notes ? ` — ${bid.notes}` : ""}
                          </p>
                          {item.status !== "accepted" && (
                            <button
                              onClick={() => void accept(bid.id)}
                              disabled={actionId === bid.id}
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 text-sm font-black text-zinc-950 disabled:opacity-50"
                            >
                              {actionId === bid.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                              اختيار وإضافة للسلة
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                      لم تصل عروض بعد. يتم التحديث تلقائيًا.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
