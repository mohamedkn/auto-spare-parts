"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  isLoggedIn: boolean;
  isWishlisted?: boolean;
}

export function WishlistButton({ productId, isLoggedIn, isWishlisted: initialWishlisted = false }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
        });
        setWishlisted(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        });
        setWishlisted(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={wishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      className={`flex items-center justify-center gap-2 py-3.5 px-5 rounded-full font-semibold text-sm border-2 transition-all duration-300 ${
        wishlisted
          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
      }`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Heart
          size={20}
          className={`transition-all duration-300 ${wishlisted ? "fill-red-500 text-red-500 scale-110" : ""}`}
        />
      )}
      <span className="hidden sm:inline">{wishlisted ? "في المفضلة" : "أضف للمفضلة"}</span>
    </button>
  );
}
