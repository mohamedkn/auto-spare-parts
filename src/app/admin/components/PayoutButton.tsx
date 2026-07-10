"use client";

import { useState } from "react";
import { processVendorPayout } from "../actions";
import { Loader2 } from "lucide-react";

export function PayoutButton({ vendorId }: { vendorId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePayout = async () => {
    if (!confirm("هل أنت متأكد من اتمام الدفع لهذا المتجر؟ سيتم تسجيل التسوية كمدفوعة.")) return;
    const bankReference = prompt("أدخل رقم مرجع التحويل البنكي أو المحفظة:")?.trim();
    if (!bankReference) return;

    setLoading(true);
    try {
      const res = await processVendorPayout(vendorId, bankReference);
      if (res.success) {
        alert(`تم دفع المستحقات بنجاح لعدد ${res.count} طلب.`);
      } else {
        alert(res.message || "حدث خطأ");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء دفع المستحقات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayout}
      disabled={loading}
      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      دفع المستحقات
    </button>
  );
}
