"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function OrderActions({ subOrder }: { subOrder: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (status: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vendor/orders/${subOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تحديث حالة الطلب");
      }

      window.alert(data.message || "تم التحديث بنجاح");
      router.refresh(); // Refresh the page to get updated statuses
    } catch (error: any) {
      window.alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {subOrder.status === "pending" && (
        <>
          <button
            onClick={() => updateStatus("cancelled")}
            disabled={isLoading}
            className="text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isLoading && <Loader2 size={12} className="animate-spin" />}
            رفض الطلب
          </button>
          
          <button
            onClick={() => updateStatus("preparing")}
            disabled={isLoading}
            className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isLoading && <Loader2 size={12} className="animate-spin" />}
            قبول الطلب
          </button>
        </>
      )}
      
      {subOrder.status === "preparing" && (
        <button
          onClick={() => {
            if (window.confirm('جاهز للشحن؟\n\nسيتم إرسال الطلب للمناديب المتاحين فوراً.')) {
              updateStatus("processing");
            }
          }}
          disabled={isLoading}
          className="text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isLoading && <Loader2 size={12} className="animate-spin" />}
          جاهز للشحن — إرسال للمندوب
        </button>
      )}

      {subOrder.status === "processing" && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            جاري البحث عن مندوب...
          </span>
          {subOrder.deliveryJob?.pickupOtp && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">رمز تسليم المندوب:</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-300 tracking-widest">{subOrder.deliveryJob.pickupOtp}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
