"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, House, LayoutDashboard, Menu, Package, PackageSearch, Search, ShieldCheck, ShoppingCart, ShoppingBag, Store, Truck, Users, Wallet, X } from "lucide-react";
import { useState } from "react";
import { NotificationMenu } from "./NotificationMenu";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardIconName;
  badge?: number;
};

export type DashboardIconName = "dashboard" | "orders" | "vendors" | "payments" | "drivers" | "catalog" | "products" | "cart" | "wallet";

const iconMap = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  vendors: Users,
  payments: Banknote,
  drivers: Truck,
  catalog: PackageSearch,
  products: Package,
  cart: ShoppingCart,
  wallet: Wallet,
};

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  kind: "admin" | "vendor";
  navItems: DashboardNavItem[];
};

export function DashboardShell({ children, title, subtitle, kind, navItems }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const BrandIcon = kind === "admin" ? ShieldCheck : Store;
  const isActive = (href: string) => href === `/${kind}` ? pathname === href : pathname.startsWith(href);

  const handleDashboardSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const destination = kind === "admin" ? "/admin/orders" : "/vendor/products";
    router.push(`${destination}?q=${encodeURIComponent(query)}`);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-6">
        <Link href={`/${kind}`} className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid size-11 place-items-center rounded-2xl bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20">
            <BrandIcon size={22} />
          </span>
          <span>
            <strong className="block text-base text-white">{title}</strong>
            <span className="text-xs text-zinc-400">{subtitle}</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 p-4" aria-label="التنقل داخل لوحة التحكم">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${active ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/15" : "text-zinc-300 hover:bg-white/8 hover:text-white"}`}>
              <Icon size={19} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-zinc-950 text-white" : "bg-amber-400 text-zinc-950"}`}>{item.badge}</span>}
              <ArrowLeft size={15} className="opacity-0 transition group-hover:opacity-70" />
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm font-bold text-zinc-200 transition hover:border-amber-400/30 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
          <House size={18} className="text-amber-300" />
          <span className="flex-1">العودة إلى المتجر</span>
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-3 text-xs leading-5 text-zinc-500">
          <div className="flex items-center gap-2 font-semibold text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
            النظام يعمل بشكل طبيعي
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div data-dashboard-shell className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl md:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="إغلاق القائمة" />
          <aside className="absolute inset-y-0 right-0 w-[86%] max-w-sm border-l border-white/10 bg-zinc-950 shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white" aria-label="إغلاق"><X size={18} /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="md:pr-72">
        <header className="sticky top-0 z-20 flex min-h-20 items-center gap-4 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white md:hidden" aria-label="فتح القائمة"><Menu size={20} /></button>
            <div>
              <p className="text-sm font-bold text-white">{navItems.find((item) => isActive(item.href))?.label ?? title}</p>
              <p className="hidden text-xs text-zinc-500 sm:block">مساحة عمل منظمة لاتخاذ قرارات أسرع</p>
            </div>
          </div>
          <form onSubmit={handleDashboardSearch} className="mx-auto hidden w-full max-w-xl items-center rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 shadow-inner shadow-black/20 transition focus-within:border-amber-400/60 focus-within:bg-white/[0.07] sm:flex">
            <Search size={18} className="mr-3 shrink-0 text-zinc-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={kind === "admin" ? "ابحث برقم الطلب..." : "ابحث في منتجات متجرك..."}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              aria-label={kind === "admin" ? "البحث في الطلبات" : "البحث في المنتجات"}
            />
            <button type="submit" disabled={!searchQuery.trim()} className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40" aria-label="تنفيذ البحث">
              <Search size={18} />
            </button>
          </form>
          <div className="mr-auto flex items-center gap-2 sm:mr-0">
            <Link href="/" className="hidden size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:border-amber-400/30 hover:text-amber-300 lg:grid" aria-label="العودة إلى المتجر"><House size={19} /></Link>
            <NotificationMenu />
          </div>
        </header>
        <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_32%),linear-gradient(to_bottom,#09090b,#111113)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
