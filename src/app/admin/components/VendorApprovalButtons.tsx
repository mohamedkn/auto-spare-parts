"use client";

import { useState } from "react";
import { approveVendor, rejectVendor } from "../actions";
import { Loader2 } from "lucide-react";

export function VendorApprovalButtons({ vendorId }: { vendorId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await approveVendor(vendorId);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء قبول المتجر");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المتجر ورفض الطلب نهائياً؟")) return;
    
    setLoading("reject");
    try {
      await rejectVendor(vendorId);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء رفض المتجر");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
      >
        {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : "موافقة"}
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        {loading === "reject" ? <Loader2 size={16} className="animate-spin" /> : "رفض"}
      </button>
    </div>
  );
}
