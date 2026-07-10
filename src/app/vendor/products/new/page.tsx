"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Car,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug?: string;
  children?: Category[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [recommendedCategory, setRecommendedCategory] = useState<Category | null>(null);


  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    status: "active" as "active" | "draft",
    oemNumber: "",
    partNumber: "",
    brand: "",
    condition: "new_original" as "new_original" | "new_aftermarket" | "used" | "refurbished",
    placement: "",
    images: [{ url: "" }],
    compatibilities: [] as { vehicleModelId: string; make: string; model: string; startYear: number | null; endYear: number | null; specificYear: number | null }[],
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((json) => {
      if (json.data) {
        const flattened = (json.data as Category[]).flatMap((parent) =>
          parent.children?.length
            ? parent.children.map((child) => ({ ...child, name: `${parent.name} / ${child.name}` }))
            : [parent],
        );
        setCategories(flattened);
      }
    });
    fetch("/api/vehicles").then((r) => r.json()).then((json) => {
      if (json.data) setVehicles(json.data);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      if (form.name.trim().length < 2) {
        setRecommendedCategory(null);
        return;
      }
      fetch(`/api/catalog/category-recommendation?q=${encodeURIComponent(form.name)}`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((json) => setRecommendedCategory(json.data?.recommendation || null))
        .catch(() => undefined);
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [form.name]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, { url: "" }] }));
  }

  function removeImageField(i: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  }

  function removeCompatibility(i: number) {
    setForm((prev) => ({ ...prev, compatibilities: prev.compatibilities.filter((_, idx) => idx !== i) }));
  }

  function addCompatibility() {
    if (!selectedMakeId || !selectedModelId) return;
    const make = vehicles.find((v) => v.id === selectedMakeId);
    const model = make?.models.find((m: any) => m.id === selectedModelId);
    if (!make || !model) return;

    const year = selectedYear ? parseInt(selectedYear, 10) : null;

    if (form.compatibilities.some((c) => c.vehicleModelId === model.id && c.specificYear === year)) {
      alert("هذه السيارة مضافة بالفعل");
      return;
    }

    setForm((prev) => ({
      ...prev,
      compatibilities: [
        ...prev.compatibilities,
        {
          vehicleModelId: model.id,
          make: make.name,
          model: model.name,
          startYear: model.startYear,
          endYear: model.endYear,
          specificYear: year,
        },
      ],
    }));
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const price = parseFloat(form.price);
    const stockQuantity = parseInt(form.stockQuantity, 10);

    if (!form.categoryId) {
      setError("يجب اختيار تصنيف دقيق للمنتج");
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError("يرجى إدخال سعر صحيح أكبر من صفر");
      return;
    }
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      setError("يرجى إدخال كمية مخزون صحيحة");
      return;
    }

    setLoading(true);
    try {
      const validImages = form.images.filter((img) => img.url.trim() !== "");

      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price,
          stockQuantity,
          categoryId: form.categoryId,
          status: form.status,
          oemNumber: form.oemNumber || undefined,
          partNumber: form.partNumber || undefined,
          brand: form.brand || undefined,
          condition: form.condition,
          placement: form.placement || undefined,
          images: validImages.length > 0 ? validImages.map((img, i) => ({ url: img.url, position: i })) : undefined,
          compatibilities: form.compatibilities.map(c => ({
            vehicleModelId: c.vehicleModelId,
            specificYear: c.specificYear
          })),
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/vendor/products"), 1500);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">تمت إضافة المنتج بنجاح!</h2>
        <p className="text-slate-500 text-sm">سيتم توجيهك إلى قائمة المنتجات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/products" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إضافة قطعة غيار</h1>
          <p className="text-slate-500 text-sm">أضف قطعة جديدة وتفاصيل توافقها مع السيارات</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}



      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800 pb-4">
              المعلومات الأساسية
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                اسم المنتج <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="تيل فرامل أمامي"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                السعر (ج.م) <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                الكمية في المخزون <span className="text-red-500">*</span>
              </label>
              <input
                name="stockQuantity"
                type="number"
                required
                min="0"
                value={form.stockQuantity}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">الفئة</label>
              <select
                name="categoryId"
                required
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
              >
                <option value="">بدون فئة</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">التصنيف إلزامي لتحسين دقة البحث ومنع عرض القطعة في قسم خاطئ.</p>
              {recommendedCategory && recommendedCategory.id !== form.categoryId && (
                <button
                  type="button"
                  onClick={() => setForm((previous) => ({ ...previous, categoryId: recommendedCategory.id }))}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  <span>اختيار التصنيف المقترح</span>
                  <strong>{recommendedCategory.name}</strong>
                </button>
              )}
            </div>
          </div>

          {/* Auto Parts Info */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800 pb-4">
              تفاصيل القطعة (أرقام وماركة)
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">رقم المصنع (OEM)</label>
                <input
                  name="oemNumber"
                  value={form.oemNumber}
                  onChange={handleChange}
                  placeholder="مثال: 04465-02390"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ماركة القطعة (Brand)</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="مثال: Bosch, Denso"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">رقم القطعة (Part Number)</label>
              <input
                name="partNumber"
                value={form.partNumber}
                onChange={handleChange}
                placeholder="مثال: 0986494"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">حالة القطعة</label>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="new_original">جديد (أصلي)</option>
                  <option value="new_aftermarket">جديد (تجارية/بديل)</option>
                  <option value="used">مستعمل / استيراد</option>
                  <option value="refurbished">مجدد</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">مكان التركيب</label>
                <input
                  name="placement"
                  value={form.placement}
                  onChange={handleChange}
                  placeholder="أمام، خلف، يمين..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 md:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <ImageIcon size={20} className="text-slate-500" />
              صور المنتج
            </h2>
            <button type="button" onClick={addImageField} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
              <Plus size={16} /> إضافة صورة
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {form.images.map((img, i) => (
              <div key={i} className="flex flex-col gap-2 relative">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">رفع الصورة {i + 1}</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => removeImageField(i)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compatibilities */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Car size={20} className="text-slate-700 dark:text-slate-300" />
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">السيارات المتوافقة (Fitment)</h2>
          </div>

          {/* Add Compatibility Form */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <select
              value={selectedMakeId}
              onChange={(e) => { setSelectedMakeId(e.target.value); setSelectedModelId(""); }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
            >
              <option value="">اختر الشركة</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>

            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              disabled={!selectedMakeId}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
            >
              <option value="">اختر الموديل</option>
              {vehicles.find(v => v.id === selectedMakeId)?.models.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="سنة الصنع (اختياري)"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-sm"
            />

            <button
              type="button"
              onClick={addCompatibility}
              disabled={!selectedMakeId || !selectedModelId}
              className="flex items-center justify-center gap-1 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 py-2 px-4 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Plus size={16} /> إضافة
            </button>
          </div>
          
          {form.compatibilities.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center">لم يتم إضافة سيارات بعد.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {form.compatibilities.map((comp, i) => (
                <div key={i} className="flex flex-col gap-1 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 relative group">
                  <button type="button" onClick={() => removeCompatibility(i)} className="absolute top-2 left-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                  <span className="font-bold text-slate-900 dark:text-white">{comp.make} {comp.model}</span>
                  <span className="text-xs text-slate-500">
                    {comp.specificYear ? `سنة: ${comp.specificYear}` : (
                      <>
                        {comp.startYear ? `${comp.startYear} ` : ""}
                        {comp.startYear && comp.endYear ? "- " : ""}
                        {comp.endYear ? `${comp.endYear}` : (comp.startYear ? "فأحدث" : "كل الموديلات")}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex gap-4">
          <Link
            href="/vendor/products"
            className="flex-1 text-center py-3 px-6 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading || !form.name || !form.price || !form.stockQuantity || !form.categoryId}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> جاري الحفظ...</> : "إضافة المنتج"}
          </button>
        </div>
      </form>
    </div>
  );
}
