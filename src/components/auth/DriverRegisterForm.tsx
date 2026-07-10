"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerDriverSchema, type RegisterDriverInput } from "@/lib/validations/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function DriverRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDriverInput>({
    resolver: zodResolver(registerDriverSchema),
    defaultValues: {
      vehicleType: "motorcycle"
    }
  });

  const onSubmit = async (data: RegisterDriverInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Append role="driver" explicitly
        body: JSON.stringify({ ...data, role: "driver" }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "حدث خطأ أثناء التسجيل");
      }

      router.push("/driver");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          الاسم بالكامل
        </label>
        <input
          {...register("name")}
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          placeholder="أحمد محمد"
          dir="rtl"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          البريد الإلكتروني
        </label>
        <input
          {...register("email")}
          type="email"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-left"
          placeholder="ahmed@example.com"
          dir="ltr"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          رقم الهاتف
        </label>
        <input
          {...register("phone")}
          type="tel"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-left"
          placeholder="01xxxxxxxxx"
          dir="ltr"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          كلمة المرور
        </label>
        <input
          {...register("password")}
          type="password"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-left"
          dir="ltr"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          نوع المركبة
        </label>
        <select
          {...register("vehicleType")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          dir="rtl"
        >
          <option value="motorcycle">موتوسيكل (للقطع الصغيرة)</option>
          <option value="car">سيارة ملاكي (للقطع المتوسطة)</option>
          <option value="truck">ربع نقل (للقطع الكبيرة كالمحركات)</option>
        </select>
        {errors.vehicleType && (
          <p className="mt-1 text-sm text-red-600">{errors.vehicleType.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            جاري التسجيل...
          </>
        ) : (
          "إنشاء حساب كابتن"
        )}
      </button>

      <div className="text-center mt-4">
        <span className="text-slate-600 text-sm">لديك حساب بالفعل؟ </span>
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          تسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
