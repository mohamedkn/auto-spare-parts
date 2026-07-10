"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  itemTotal: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    stockQuantity: number;
    status: string;
    vendor: { id: string; storeName: string };
    images: { url: string }[];
  };
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: string;
}

interface GuestCartItem {
  productId: string;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      // Attempt to fetch authenticated cart first (cookie is sent automatically)
      const res = await fetch("/api/cart");
      if (res.ok) {
        setIsLoggedIn(true);
        const json = await res.json();
        setCart(json.data);
      } else {
        // Fallback to guest cart
        setIsLoggedIn(false);
        const stored = localStorage.getItem("guestCart");
        if (stored) {
          const guestItems = JSON.parse(stored) as GuestCartItem[];
          const resGuest = await fetch("/api/cart/guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: guestItems }),
          });
          if (resGuest.ok) {
            const json = await resGuest.json();
            setCart(json.data);
          } else {
            setCart({ items: [], totalItems: 0, totalPrice: "0" });
          }
        } else {
          setCart({ items: [], totalItems: 0, totalPrice: "0" });
        }
      }
    } catch (error: unknown) {
      setDebugError("Fetch error: " + (error instanceof Error ? error.message : "Unknown error"));
      setCart({ items: [], totalItems: 0, totalPrice: "0" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote synchronization is an intentional effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCart();
  }, [fetchCart]);

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) {
      removeItem(itemId);
      return;
    }
    setUpdatingId(itemId);
    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQty }),
        });
        if (res.ok) {
          await fetchCart();
          router.refresh();
        }
      } else {
        const stored = localStorage.getItem("guestCart");
        if (stored) {
          const guestItems = JSON.parse(stored) as GuestCartItem[];
          const productId = itemId.replace("guest-", "");
          const index = guestItems.findIndex((item) => item.productId === productId);
          if (index > -1) {
            guestItems[index].quantity = newQty;
            localStorage.setItem("guestCart", JSON.stringify(guestItems));
            window.dispatchEvent(new Event("cartUpdated"));
            await fetchCart();
          }
        }
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdatingId(itemId);
    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchCart();
          router.refresh();
        }
      } else {
        const stored = localStorage.getItem("guestCart");
        if (stored) {
          let guestItems = JSON.parse(stored) as GuestCartItem[];
          const productId = itemId.replace("guest-", "");
          guestItems = guestItems.filter((item) => item.productId !== productId);
          localStorage.setItem("guestCart", JSON.stringify(guestItems));
          window.dispatchEvent(new Event("cartUpdated"));
          await fetchCart();
        }
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (debugError) {
    return <div className="p-10 text-red-500">Error: {debugError}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
        <ShoppingCart size={28} />
        سلة التسوق
      </h1>
      <p className="text-slate-500 mb-8">
        {isEmpty ? "سلتك فارغة" : `${cart.totalItems} منتج في سلتك`}
      </p>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <ShoppingCart size={64} className="mb-6 opacity-20 text-primary-500" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            سلتك فارغة حالياً
          </h3>
          <p className="text-slate-500 mb-8">اكتشف منتجاتنا الرائعة وأضف ما يعجبك</p>
          <Link
            href="/products"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-8 py-3.5 rounded-full transition-colors shadow-md"
          >
            <ArrowLeft size={18} />
            تصفح المنتجات
          </Link>

          {!isLoggedIn && (
            <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 text-center max-w-sm">
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
                سجّل دخولك للحفاظ على سلتك وتتبع طلباتك
              </p>
              <Link
                href="/login"
                className="text-sm font-bold text-primary dark:text-primary-400 hover:underline"
              >
                تسجيل الدخول →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <Link href={`/products/${item.product.id}`} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={32} className="text-slate-300" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <p className="text-xs text-primary dark:text-primary-400 font-medium">
                    {item.product.vendor.storeName}
                  </p>
                  <Link href={`/products/${item.product.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-2 text-sm">
                    {item.product.name}
                  </Link>
                  <p className="font-bold text-lg text-slate-900 dark:text-white mt-auto">
                    {Number(item.itemTotal).toLocaleString("ar-EG")} ج.م
                  </p>
                  <p className="text-xs text-slate-400">
                    {Number(item.product.price).toLocaleString("ar-EG")} ج.م × {item.quantity}
                  </p>
                </div>

                {/* Quantity & Remove */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={!!updatingId}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {updatingId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Minus size={14} />
                      )}
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={!!updatingId || item.quantity >= item.product.stockQuantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={!!updatingId}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-20">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                ملخص الطلب
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">إجمالي المنتجات ({cart.totalItems})</span>
                  <span className="font-semibold">{Number(cart.totalPrice).toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="font-bold text-lg text-slate-900 dark:text-white">قيمة المنتجات</span>
                  <span className="font-bold text-xl text-primary dark:text-primary-400">
                    {Number(cart.totalPrice).toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-500 bg-slate-50 dark:bg-slate-800/70 rounded-xl px-3 py-2.5">
                  رسوم الشحن تُضاف وتُعرض بوضوح في خطوة الدفع.
                </p>
              </div>

              {isLoggedIn ? (
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-bold py-4 rounded-full transition-colors shadow-md hover:shadow-lg text-base"
                >
                  إتمام الشراء
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login?callbackUrl=/checkout"
                    className="w-full text-center bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-full transition-colors"
                  >
                    تسجيل الدخول للمتابعة
                  </Link>
                  <p className="text-center text-xs text-slate-500">
                    سلتك محفوظة لك حتى بعد تسجيل الدخول
                  </p>
                </div>
              )}

              <Link
                href="/products"
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors py-2"
              >
                <ArrowLeft size={14} />
                متابعة التسوق
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
