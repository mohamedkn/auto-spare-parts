"use client";

import { Clock3, Loader2, Radar, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type LiveRequest = {
  id: string;
  description: string;
  vin?: string | null;
  imageUrl?: string | null;
  aiParsedData?: {
    partName?: string;
    make?: string;
    model?: string;
    year?: number;
    oemNumber?: string;
    weightClass?: string;
  };
  biddingEndsAt: string;
  category?: { name: string } | null;
  bids: Array<{ id: string; price: string; condition: string; notes?: string }>;
};
const conditions = [
  { value: "new_original", label: "جديد أصلي" },
  { value: "new_aftermarket", label: "جديد بديل" },
  { value: "used", label: "مستعمل" },
  { value: "refurbished", label: "مجدّد" },
];

export default function VendorLivePage() {
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState<
    Record<string, { price: string; condition: string; notes: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const started = Date.now();
      const response = await fetch("/api/vendor/live-requests", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر تحميل الطلبات");
      setServerOffset(
        new Date(body.data.serverTime).getTime() -
          Math.round((started + Date.now()) / 2),
      );
      setRequests(body.data.requests);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initialLoad = setTimeout(() => {
      setNow(Date.now());
      void load();
    }, 0);
    const poll = setInterval(() => void load(), 8_000);
    const clock = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);
  const visible = useMemo(
    () =>
      requests.filter(
        (item) => new Date(item.biddingEndsAt).getTime() > now + serverOffset,
      ),
    [requests, now, serverOffset],
  );
  const remaining = (value: string) => {
    const seconds = Math.max(
      0,
      Math.ceil((new Date(value).getTime() - now - serverOffset) / 1000),
    );
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const submit = async (item: LiveRequest) => {
    const current = forms[item.id] || {
      price: item.bids[0]?.price || "",
      condition: item.bids[0]?.condition || "new_original",
      notes: item.bids[0]?.notes || "",
    };
    setSaving(item.id);
    try {
      const response = await fetch("/api/vendor/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: item.id,
          price: current.price,
          condition: current.condition,
          notes: current.notes || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "تعذر حفظ العرض");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر حفظ العرض");
    } finally {
      setSaving(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-300">الرادار اللحظي</p>
          <h1 className="mt-1 text-3xl font-black text-white">
            طلبات تحتاج تسعيرًا الآن
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            كل طلب متاح لمدة 5 دقائق محسوبة من توقيت الخادم.
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
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="animate-spin text-amber-400" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] py-20 text-center">
          <Radar className="mx-auto text-zinc-600" size={44} />
          <h2 className="mt-4 font-black text-zinc-300">
            لا توجد طلبات حية الآن
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            ستظهر الطلبات الجديدة تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visible.map((item) => {
            const form = forms[item.id] || {
              price: item.bids[0]?.price || "",
              condition: item.bids[0]?.condition || "new_original",
              notes: item.bids[0]?.notes || "",
            };
            return (
              <article
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/[.055] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-300">
                      {item.category?.name || "طلب حر"}
                    </span>
                    <h2 className="mt-1 text-lg font-black text-white">
                      {item.aiParsedData?.partName || item.description}
                    </h2>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 font-mono text-sm font-black text-red-300">
                    <Clock3 size={16} />
                    {remaining(item.biddingEndsAt)}
                  </span>
                </div>
                <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-6 text-zinc-300">
                  {item.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                  {item.aiParsedData?.make && (
                    <span>
                      {item.aiParsedData.make} {item.aiParsedData.model}{" "}
                      {item.aiParsedData.year}
                    </span>
                  )}
                  {item.aiParsedData?.oemNumber && (
                    <span>OEM: {item.aiParsedData.oemNumber}</span>
                  )}
                  {item.vin && <span>VIN: {item.vin}</span>}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForms((all) => ({
                        ...all,
                        [item.id]: { ...form, price: e.target.value },
                      }))
                    }
                    placeholder="السعر بالجنيه"
                    className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                  />
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForms((all) => ({
                        ...all,
                        [item.id]: { ...form, condition: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                  >
                    {conditions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForms((all) => ({
                      ...all,
                      [item.id]: { ...form, notes: e.target.value },
                    }))
                  }
                  placeholder="ملاحظات الضمان أو الماركة (اختياري)"
                  rows={2}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-white outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => void submit(item)}
                  disabled={saving === item.id || !form.price}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-black text-zinc-950 disabled:opacity-50"
                >
                  {saving === item.id ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Send size={17} />
                  )}
                  {item.bids.length ? "تحديث العرض" : "إرسال العرض"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
