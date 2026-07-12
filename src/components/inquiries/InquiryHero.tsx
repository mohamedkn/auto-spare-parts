"use client";

import Link from "next/link";
import { Camera, Loader2, Radar, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { VEHICLE_MARKETS } from "@/lib/vehicles/markets";

export function InquiryHero() {
  const [description, setDescription] = useState("");
  const [vin, setVin] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [vehicleMarket, setVehicleMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description, vin: vin || undefined, imageUrl: imageUrl || undefined, vehicleMarkets: vehicleMarket ? [vehicleMarket] : [] }) });
      const body = await response.json();
      if (response.status === 401) throw new Error("سجّل الدخول أولًا لإرسال طلب التسعير");
      if (!response.ok) throw new Error(body.error || "تعذر إرسال الطلب");
      setDescription(""); setVin(""); setImageUrl(""); setVehicleMarket("");
      setMessage({ type: "success", text: "استلمنا طلبك. سيُراجع ثم يُرسل للتجار لمدة 5 دقائق." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "تعذر إرسال الطلب" });
    } finally { setLoading(false); }
  };

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 pb-16 pt-12 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,.18),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(59,130,246,.12),transparent_30%)]" />
      <div className="container relative mx-auto grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300"><Radar size={15} /> طلبات قطع الغيار الذكية</span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">مش عارف اسم القطعة؟<br /><span className="text-amber-400">اوصفها والتجار يسعّروها.</span></h1>
          <p className="mt-4 max-w-xl leading-8 text-zinc-300">اكتب وصفك بالعامية أو رقم الشاسيه. نراجع التحليل ثم نتيح الطلب للتجار المعتمدين لمدة 5 دقائق فقط.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-zinc-300"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> عروض من تجار معتمدين</span><span className="flex items-center gap-2"><Radar size={16} className="text-amber-400" /> تحديث سريع للعروض</span></div>
          <Link href="/inquiries" className="mt-7 inline-flex font-bold text-amber-300 hover:text-amber-200">متابعة طلباتي وعروضي ←</Link>
        </div>
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          <label className="mb-2 block text-sm font-bold">صف القطعة أو المشكلة</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={10} maxLength={2000} required rows={5} placeholder="مثال: محتاج مقص أمامي يمين لإلنترا 2017 ويفضل أصلي..." className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400" />
          <fieldset className="mt-3">
            <legend className="mb-2 text-xs font-bold text-zinc-300">نوع السيارة</legend>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_MARKETS.map(({ value, label }) => {
                const selected = vehicleMarket === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVehicleMarket(selected ? "" : value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition duration-200 ${selected ? "scale-[1.02] border-amber-400 bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/10" : "border-white/10 bg-black/20 text-zinc-300 hover:border-amber-400/40 hover:text-white"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN اختياري" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-amber-400" /><div className="relative"><Camera className="absolute right-3 top-3.5 text-zinc-500" size={17} /><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" placeholder="رابط صورة HTTPS اختياري" className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-3 pr-10 text-sm outline-none focus:border-amber-400" /></div></div>
          <button disabled={loading || description.trim().length < 10} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 font-black text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={19} /> : <Send size={18} />}{loading ? "جاري التحليل..." : "أرسل طلب التسعير"}</button>
          {message && <p className={`mt-3 rounded-xl px-3 py-2 text-center text-xs font-bold ${message.type === "success" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{message.text}</p>}
        </form>
      </div>
    </section>
  );
}
