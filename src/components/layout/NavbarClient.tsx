"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  MapPin,
  LogOut,
  Store,
  Shield,
} from "lucide-react";
import { SmartSearch } from "@/components/home/SmartSearch";

interface NavbarClientProps {
  user: { name: string; role: string } | null;
  cartCount: number;
  categories?: { id: string; name: string; slug: string }[];
}

export function NavbarClient({ user, cartCount, categories = [] }: NavbarClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [guestCartCount, setGuestCartCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const isAdminOrVendor = pathname?.startsWith("/admin") || pathname?.startsWith("/vendor");

  useEffect(() => {
    if (user) return; // Only for guests
    const calculateGuestCart = () => {
      try {
        const guestCartStr = localStorage.getItem("guestCart") || "[]";
        const guestCart = JSON.parse(guestCartStr);
        const count = guestCart.reduce((total: number, item: { quantity?: number }) => total + (item.quantity || 1), 0);
        setGuestCartCount(count);
      } catch {}
    };
    
    // Initial calculate
    calculateGuestCart();
    
    // Listen for updates
    window.addEventListener("cartUpdated", calculateGuestCart);
    return () => window.removeEventListener("cartUpdated", calculateGuestCart);
  }, [user]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const displayCartCount = user ? cartCount : guestCartCount;

  // Dashboard routes provide their own navigation and contextual search.
  if (isAdminOrVendor) return null;

  return (
    <nav className="storefront-navbar sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 shadow-2xl transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-primary"
              aria-label="القائمة"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" aria-label="AutoParts — الرئيسية" className="group flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 p-2 text-zinc-950 shadow-lg shadow-amber-500/15 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                <Package size={20} className="stroke-[2.5]" />
              </div>
              <span className="hidden flex-col leading-none sm:flex" dir="ltr">
                <span className="text-[21px] font-black tracking-[-0.045em]">
                  <span className="text-white">AUTO</span><span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">PARTS</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[9px] font-bold tracking-normal text-zinc-500" dir="rtl">
                  <span className="h-px w-4 bg-amber-400" /> سوق قطع الغيار الموثوق
                </span>
              </span>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
            <SmartSearch isHeader={true} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 text-white hover:text-primary transition-colors group relative"
              title="المفضلة"
            >
              <Heart size={22} className="group-hover:scale-110 transition-transform duration-300" />
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-white hover:text-primary transition-colors group"
              title="السلة"
            >
              <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-300" />
              {displayCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {displayCartCount > 9 ? "9+" : displayCartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white hover:bg-zinc-900 transition-colors text-sm font-medium"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-black text-xs font-bold select-none">
                    {firstName.charAt(0)}
                  </div>
                  <span className="max-w-[80px] truncate">{firstName}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isAccountOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {isAccountOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsAccountOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-20 overflow-hidden py-2">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500">مرحباً،</p>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm transition-colors"
                      >
                        <User size={16} />
                        <span>حسابي</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm transition-colors"
                      >
                        <Package size={16} />
                        <span>طلباتي</span>
                      </Link>
                      <Link
                        href="/profile/addresses"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm transition-colors"
                      >
                        <MapPin size={16} />
                        <span>عناويني</span>
                      </Link>

                      {/* Vendor link */}
                      {user.role === "vendor" && (
                        <Link
                          href="/vendor"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm transition-colors border-t border-slate-100 dark:border-slate-800"
                        >
                          <Store size={16} />
                          <span>لوحة التاجر</span>
                        </Link>
                      )}

                      {/* Admin link */}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-sm transition-colors border-t border-slate-100 dark:border-slate-800"
                        >
                          <Shield size={16} />
                          <span>لوحة الإدارة</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => { setIsAccountOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors"
                        >
                          <LogOut size={16} />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors text-sm font-medium"
              >
                <User size={16} />
                <span>دخول</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-3 pt-1">
          <SmartSearch isHeader={true} />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 py-4 flex flex-col gap-1">
            {user ? (
              <>
                <p className="px-4 py-2 text-sm text-slate-500">مرحباً، {user.name}</p>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  <User size={16} /> حسابي
                </Link>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  <Package size={16} /> طلباتي
                </Link>
                <Link href="/vendors" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  <Store size={16} /> التجار
                </Link>
                {user.role === "vendor" && (
                  <Link href="/vendor" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl text-sm transition-colors">
                    <Store size={16} /> لوحة التاجر
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-sm transition-colors">
                    <Shield size={16} /> لوحة الإدارة
                  </Link>
                )}
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm transition-colors"
                >
                  <LogOut size={16} /> تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  <User size={16} /> تسجيل الدخول
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  إنشاء حساب
                </Link>
                <Link href="/vendors" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                  <Store size={16} /> التجار
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Categories Bar (Bottom Tier) */}
      {!isAdminOrVendor && (
        <div className="hidden lg:block bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md border-t border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-6 h-10 overflow-x-auto no-scrollbar">
            <li>
              <Link href="/products" className="text-sm font-bold text-black dark:text-white hover:text-primary whitespace-nowrap transition-colors">
                جميع المنتجات
              </Link>
            </li>
            <li>
              <Link href="/vendors" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-primary whitespace-nowrap transition-colors">
                التجار
              </Link>
            </li>
            {categories?.map((cat) => (
              <li key={cat.id}>
                <Link href={`/products?categoryId=${cat.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-primary whitespace-nowrap transition-colors">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
