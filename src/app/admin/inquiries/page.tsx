"use client";

import { Check, Clock3, Loader2, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Inquiry = {
  id: string;
  description: string;
  vin?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  aiParsedData?: {
    partName?: string;
    oemNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    weightClass?: string;
    confidence?: number;
  };
  user: { name: string; phone?: string | null };
  category?: { name: string } | null;
  _count: { bids: number };
};
const labels: Record<string, string> = {
  under_review: "بانتظار المراجعة",
  open: "مفتوح 5 دقائق",
  bidding_closed: "انتهى التسعير",
  accepted: "تم قبول عرض",
  cancelled: "مرفوض",
  expired: "منتهي",
};

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/inquiries", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر التحميل");
      setItems(body.data.inquiries);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);
  const review = async (id: string, action: "approve" | "reject") => {
    setSaving(id);
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر حفظ المراجعة");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر حفظ المراجعة");
    } finally {
      setSaving(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-300">Human in the loop</p>
          <h1 className="mt-1 text-3xl font-black text-white">
            مراجعة تحليل طلبات القطع
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            الموافقة تبدأ فورًا نافذة التجار المحددة بـ5 دقائق.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl border border-white/10 bg-white/5 p-3 text-amber-300"
        >
          <RefreshCw size={19} />
        </button>
      </div>
      {error && (
        <p className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </p>
      )}
      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/[.05] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-zinc-400">
                    <span>{item.user.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString("ar-EG")}
                    </span>
                    {item.category && (
                      <>
                        <span>•</span>
                        <span>{item.category.name}</span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-white">
                    {item.aiParsedData?.partName || "لم يُحدد اسم القطعة"}
                  </h2>
                  <p className="mt-2 rounded-xl bg-black/20 p-3 text-sm leading-7 text-zinc-300">
                    {item.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {item.aiParsedData?.make && (
                      <span className="rounded-lg bg-blue-400/10 px-2 py-1 text-blue-200">
                        {item.aiParsedData.make} {item.aiParsedData.model}{" "}
                        {item.aiParsedData.year}
                      </span>
                    )}
                    {item.aiParsedData?.oemNumber && (
                      <span className="rounded-lg bg-amber-400/10 px-2 py-1 text-amber-200">
                        OEM {item.aiParsedData.oemNumber}
                      </span>
                    )}
                    <span className="rounded-lg bg-white/5 px-2 py-1 text-zinc-300">
                      وزن {item.aiParsedData?.weightClass || "medium"}
                    </span>
                    <span className="rounded-lg bg-white/5 px-2 py-1 text-zinc-300">
                      ثقة{" "}
                      {Math.round((item.aiParsedData?.confidence || 0) * 100)}%
                    </span>
                    {item.vin && (
                      <span className="rounded-lg bg-white/5 px-2 py-1 text-zinc-300">
                        VIN {item.vin}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300">
                    <Clock3 size={14} />
                    {labels[item.status] || item.status}
                  </span>
                  <p className="mt-2 text-xs text-zinc-500">
                    {item._count.bids} عروض
                  </p>
                </div>
              </div>
              {item.status === "under_review" && (
                <div className="mt-5 flex gap-3 border-t border-white/10 pt-4">
                  <button
                    onClick={() => void review(item.id, "approve")}
                    disabled={saving === item.id}
                    className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-zinc-950 disabled:opacity-50"
                  >
                    {saving === item.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    اعتماد وبث الآن
                  </button>
                  <button
                    onClick={() => void review(item.id, "reject")}
                    disabled={saving === item.id}
                    className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm font-bold text-red-200"
                  >
                    <X size={16} />
                    رفض
                  </button>
                </div>
              )}
            </article>
          ))}
          {items.length === 0 && (
            <p className="rounded-3xl border border-dashed border-white/15 py-20 text-center text-zinc-500">
              لا توجد طلبات للمراجعة
            </p>
          )}
        </div>
      )}
    </div>
  );
}
