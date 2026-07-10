"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Loader2 } from "lucide-react";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vendor/products/${productId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "حدث خطأ أثناء الحذف");
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link 
        href={`/vendor/products/${productId}/edit`}
        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/50"
      >
        <Edit2 size={16} />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/50 disabled:opacity-50"
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  );
}
