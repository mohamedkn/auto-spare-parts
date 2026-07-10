"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
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

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          role: "customer",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      // Token is now set securely via HttpOnly cookie in the API response
      router.push("/");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-6">
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          زي
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          إنشاء حساب جديد
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          انضم إلى ملايين المتسوقين على زي
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
            <input
              id="name" name="name" type="text" autoComplete="name" required
              value={form.name} onChange={handleChange}
              placeholder="محمد أحمد"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={form.email} onChange={handleChange}
              placeholder="example@email.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              رقم الهاتف <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <input
              id="phone" name="phone" type="tel" autoComplete="tel"
              value={form.phone} onChange={handleChange}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password" required
              value={form.password} onChange={handleChange}
              placeholder="8 أحرف على الأقل"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور</label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
              value={form.confirmPassword} onChange={handleChange}
              placeholder="أعد إدخال كلمة المرور"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-semibold py-2.5 text-sm transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حسابي"}
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            بالتسجيل، أنت توافق على{" "}
            <Link href="#" className="text-indigo-600 hover:underline">شروط الاستخدام</Link>
            {" "}و{" "}
            <Link href="#" className="text-indigo-600 hover:underline">سياسة الخصوصية</Link>
          </p>
        </form>
      </div>

      {/* Already have account */}
      <div className="w-full max-w-sm flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-500">لديك حساب بالفعل؟</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      <Link
        href="/login"
        className="w-full max-w-sm text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-400 transition-all duration-200"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}
