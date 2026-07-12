"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, CheckCircle, Shield, TrendingUp } from "lucide-react";

const PERKS = [
  { icon: TrendingUp, text: "وصول لملايين العملاء في مصر والعالم العربي" },
  { icon: Shield, text: "حماية كاملة لأموالك — نسحبها فقط بعد تسليم الطلب" },
  { icon: Store, text: "لوحة تحكم متكاملة لإدارة منتجاتك وطلباتك" },
];

const VEHICLE_MARKETS = [
  { value: "german", label: "ألماني" }, { value: "korean", label: "كوري" },
  { value: "japanese", label: "ياباني" }, { value: "american", label: "أمريكي" },
  { value: "chinese", label: "صيني" }, { value: "european", label: "أوروبي آخر" },
  { value: "other", label: "أخرى" },
] as const;

export default function VendorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"account" | "store">("account");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [form, setForm] = useState({
    // Account
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // Store
    storeName: "",
    storeDescription: "",
    // Payout details
    bankAccount: "",
    instapayHandle: "",
    walletPhone: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور لازم تكون 8 أحرف على الأقل");
      return;
    }
    setStep("store");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (specialties.length === 0) {
      setError("اختر تخصصًا واحدًا على الأقل لمتجرك");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: "vendor",
          storeName: form.storeName,
          storeDescription: form.storeDescription,
          bankAccount: form.bankAccount,
          instapayHandle: form.instapayHandle,
          walletPhone: form.walletPhone,
          specialties,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      // Token is now set securely via HttpOnly cookie in the API response
      router.push("/vendor");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              زي
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            ابدأ بيعك على زي اليوم
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            انضم لآلاف التجار الناجحين على منصتنا
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Perks sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <Icon size={22} />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{text}</p>
              </div>
            ))}

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">بعد التسجيل</span>
              </div>
              <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
                سيتم مراجعة طلبك من فريق زي خلال 24-48 ساعة. بعد الموافقة ستتمكن من نشر منتجاتك والبدء في البيع فوراً.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Steps indicator */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep("account")}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${step === "account" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  1. بيانات الحساب
                </button>
                <button
                  type="button"
                  disabled={!form.name || !form.email || !form.password}
                  onClick={() => form.password === form.confirmPassword && form.password.length >= 8 && setStep("store")}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${step === "store" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"}`}
                >
                  2. بيانات المتجر
                </button>
              </div>

              <div className="p-8">
                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                {step === "account" ? (
                  <form onSubmit={handleNextStep} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                        <input
                          id="name" name="name" type="text" required
                          value={form.name} onChange={handleChange}
                          placeholder="محمد أحمد"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                        <input
                          id="email" name="email" type="email" required
                          value={form.email} onChange={handleChange}
                          placeholder="example@email.com"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          رقم الهاتف <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                        </label>
                        <input
                          id="phone" name="phone" type="tel"
                          value={form.phone} onChange={handleChange}
                          placeholder="01xxxxxxxxx"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
                        <input
                          id="password" name="password" type="password" required
                          value={form.password} onChange={handleChange}
                          placeholder="8 أحرف على الأقل"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور</label>
                        <input
                          id="confirmPassword" name="confirmPassword" type="password" required
                          value={form.confirmPassword} onChange={handleChange}
                          placeholder="أعد إدخال كلمة المرور"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 text-sm transition-colors duration-200"
                    >
                      التالي: بيانات المتجر →
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="storeName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسم المتجر</label>
                      <input
                        id="storeName" name="storeName" type="text" required
                        value={form.storeName} onChange={handleChange}
                        placeholder="مثال: متجر الإلكترونيات"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                      />
                      <p className="text-xs text-slate-400">سيكون هذا الاسم ظاهراً للعملاء عند التسوق</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="storeDescription" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        وصف المتجر <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
                      </label>
                      <textarea
                        id="storeDescription" name="storeDescription"
                        value={form.storeDescription} onChange={handleChange}
                        placeholder="اكتب وصفاً مختصراً عن متجرك، المنتجات التي تبيعها، والمزايا التي تقدمها..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none"
                      />
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <legend className="px-2 text-sm font-bold text-slate-900 dark:text-white">تخصصات السيارات <span className="text-red-500">*</span></legend>
                      <p className="mb-3 text-xs leading-5 text-slate-500">اختر فرعًا أو أكثر. سنرسل لك طلبات التسعير المطابقة لتخصصك فقط.</p>
                      <div className="flex flex-wrap gap-2">
                        {VEHICLE_MARKETS.map((market) => {
                          const selected = specialties.includes(market.value);
                          return <button key={market.value} type="button" onClick={() => setSpecialties((current) => selected ? current.filter((value) => value !== market.value) : [...current, market.value])} className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${selected ? "border-amber-400 bg-amber-400 text-zinc-950 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}>{selected && <CheckCircle className="ml-1 inline" size={15} />}{market.label}</button>;
                        })}
                      </div>
                    </fieldset>

                    {/* الحسابات البنكية والمحافظ */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">بيانات التحويلات (Payouts)</h4>
                      
                      <div className="flex flex-col gap-1.5 mb-4">
                        <label htmlFor="bankAccount" className="text-sm font-semibold text-slate-700 dark:text-slate-300">الحساب البنكي <span className="text-red-500">*</span></label>
                        <input
                          id="bankAccount" name="bankAccount" type="text" required
                          value={form.bankAccount} onChange={handleChange}
                          placeholder="مثال: رقم الحساب أو الآيبان (IBAN) - 필수 لتحويل أرباحك"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="instapayHandle" className="text-sm font-semibold text-slate-700 dark:text-slate-300">حساب إنستاباي <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                          <input
                            id="instapayHandle" name="instapayHandle" type="text"
                            value={form.instapayHandle} onChange={handleChange}
                            placeholder="username@instapay"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="walletPhone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">رقم محفظة إلكترونية <span className="text-slate-400 font-normal text-xs">(اختياري)</span></label>
                          <input
                            id="walletPhone" name="walletPhone" type="tel"
                            value={form.walletPhone} onChange={handleChange}
                            placeholder="01xxxxxxxxx"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setStep("account")}
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        ← رجوع
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !form.storeName || !form.bankAccount}
                        className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 text-sm transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "جاري إنشاء المتجر..." : "إنشاء متجري"}
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-center text-xs text-slate-400 mt-5">
                  لديك حساب بالفعل؟{" "}
                  <Link href="/login" className="text-indigo-600 hover:underline font-medium">تسجيل الدخول</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
