"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      // Token is now set securely via HttpOnly cookie in the API response
      // Sync guest cart
      try {
        const guestCartStr = localStorage.getItem("guestCart");
        if (guestCartStr) {
          const guestItems = JSON.parse(guestCartStr);
          if (guestItems.length > 0) {
            await fetch("/api/cart/sync", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${json.data.token}`
              },
              body: JSON.stringify({ items: guestItems }),
            });
            localStorage.removeItem("guestCart");
            window.dispatchEvent(new Event("cartUpdated"));
          }
        }
      } catch (err) {}

      // Redirect based on role
      const role = json.data.user.role;
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "vendor") {
        router.push("/vendor");
      } else {
        router.push(callbackUrl || "/");
      }
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مجدداً.");
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          تسجيل الدخول
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-200 text-sm"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-200 text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-semibold py-2.5 text-sm transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          بالمتابعة، أنت توافق على{" "}
          <Link href="#" className="text-indigo-600 hover:underline">شروط الاستخدام</Link>
          {" "}و{" "}
          <Link href="#" className="text-indigo-600 hover:underline">سياسة الخصوصية</Link>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-500">ليس لديك حساب؟</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Register links */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <Link
          href="/register"
          className="w-full text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-400 transition-all duration-200"
        >
          إنشاء حساب عميل جديد
        </Link>
        <Link
          href="/vendor/register"
          className="w-full text-center rounded-lg border border-amber-300 dark:border-amber-700/50 bg-white dark:bg-slate-950 text-amber-700 dark:text-amber-400 font-semibold py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-200"
        >
          سجّل متجرك معنا
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="animate-pulse">جاري التحميل...</span></div>}>
      <LoginForm />
    </Suspense>
  );
}
