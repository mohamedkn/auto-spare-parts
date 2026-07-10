"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  isLoggedIn: boolean;
  inStock: boolean;
  quantity?: number;
  variant?: "full" | "compact" | "circle";
}

export function AddToCartButton({
  productId,
  isLoggedIn,
  inStock,
  quantity = 1,
  variant = "full",
}: AddToCartButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const router = useRouter();

  async function handleAddToCart() {
    if (!inStock) return;

    if (!isLoggedIn) {
      // Guest Cart Logic
      setStatus("loading");
      try {
        const guestCartStr = localStorage.getItem("guestCart") || "[]";
        const guestCart = JSON.parse(guestCartStr);
        const existingItemIndex = guestCart.findIndex((item: any) => item.productId === productId);
        
        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity += quantity;
        } else {
          guestCart.push({ productId, quantity });
        }
        
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("cartUpdated"));
        
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        setStatus("success");
        router.refresh(); // Refresh to update cart count in Navbar
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  if (variant === "circle") {
    return (
      <button
        onClick={handleAddToCart}
        disabled={!inStock || status === "loading"}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-primary hover:bg-primary hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        title="أضف إلى العربة"
      >
        {status === "success" ? <Check size={16} /> : status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <span className="text-xl leading-none -mt-0.5">+</span>}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleAddToCart}
        disabled={!inStock || status === "loading"}
        className="text-sm px-3 py-1.5 rounded-full bg-black text-primary font-medium hover:bg-primary hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "success" ? <Check size={14} className="inline" /> : "أضف"}
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={!inStock || status === "loading"}
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-base transition-all duration-300 ${
        !inStock
          ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
          : status === "success"
          ? "bg-emerald-500 text-white scale-95"
          : status === "error"
          ? "bg-red-500 text-white"
          : "bg-primary hover:bg-yellow-500 active:scale-95 text-black shadow-md hover:shadow-lg"
      }`}
    >
      {status === "loading" ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>جاري الإضافة...</span>
        </>
      ) : status === "success" ? (
        <>
          <Check size={20} />
          <span>تمت الإضافة للسلة!</span>
        </>
      ) : status === "error" ? (
        <span>حدث خطأ، حاول مجدداً</span>
      ) : (
        <>
          <ShoppingCart size={20} />
          <span>{inStock ? "أضف إلى السلة" : "نفذ من المخزون"}</span>
        </>
      )}
    </button>
  );
}
