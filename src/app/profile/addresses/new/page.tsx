"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Loader2, Save } from "lucide-react";

export default function NewAddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    label: "المنزل",
    fullName: "",
    phone: "",
    governorate: "",
    city: "",
    streetAddress: "",
    buildingApartment: "",
    landmark: "",
    isDefault: false,
  });

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setError("متصفحك لا يدعم تحديد الموقع");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ar`,
            {
              headers: {
                "User-Agent": "AutoPartsApp/1.0",
              },
            }
          );
          const data = await res.json();
          if (data && data.address) {
            setFormData((prev) => ({
              ...prev,
              city: data.address.city || data.address.town || data.address.village || prev.city,
              governorate: data.address.state || data.address.region || prev.governorate,
              streetAddress: `${data.address.road || ''} ${data.address.suburb || ''}`.trim() || data.display_name || prev.streetAddress,
            }));
            setError("");
          }
        } catch (err) {
          setError("تعذر تحويل الإحداثيات إلى عنوان نصي");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setError("تعذر الحصول على الموقع، يرجى التأكد من تفعيل صلاحيات الموقع");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "حدث خطأ أثناء حفظ العنوان");
      }

      router.push("/profile/addresses");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile/addresses" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">عنوان جديد</h1>
          <p className="text-slate-500 mt-1">أضف تفاصيل عنوان الشحن الخاص بك</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            هل تريد ملء العنوان تلقائياً؟
          </p>
          <button
            type="button"
            onClick={handleFetchLocation}
            disabled={gpsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
          >
            {gpsLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
            استخدام موقعي الحالي
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اسم العنوان (مثال: المنزل، العمل)</label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الاسم بالكامل للمستلم</label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">رقم الهاتف</label>
            <input
              required
              type="tel"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              dir="ltr"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المحافظة</label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المدينة / المنطقة</label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">عنوان الشارع بالتفصيل</label>
            <textarea
              required
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">رقم المبنى والدور والشقة (اختياري)</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.buildingApartment}
                onChange={(e) => setFormData({ ...formData, buildingApartment: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">علامة مميزة (اختياري)</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <input
              type="checkbox"
              id="isDefault"
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="text-slate-700 dark:text-slate-300 select-none">
              تعيين كعنوان الشحن الافتراضي
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              حفظ العنوان
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
