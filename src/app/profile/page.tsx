import { getUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Heart,
  ChevronLeft,
  LogOut,
  Store,
} from "lucide-react";

export default async function ProfilePage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      vendorProfile: {
        select: { storeName: true, slug: true, status: true },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get counts separately
  const ordersCount = await prisma.order.count({ where: { userId: session.userId } });
  const wishlistCount = await prisma.wishlistItem.count({ where: { userId: session.userId } });

  const menuItems = [
    {
      href: "/orders",
      icon: Package,
      label: "طلباتي",
      desc: "تتبع وإدارة طلباتك",
      badge: ordersCount > 0 ? String(ordersCount) : null,
    },
    {
      href: "/profile/addresses",
      icon: MapPin,
      label: "عناويني",
      desc: "إدارة عناوين الشحن",
      badge: null,
    },
    {
      href: "/wishlist",
      icon: Heart,
      label: "قائمة المفضلة",
      desc: "المنتجات المحفوظة",
      badge: wishlistCount > 0 ? String(wishlistCount) : null,
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-10 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg select-none">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            مرحباً، {user.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
          {user.phone && (
            <p className="text-slate-500 text-sm">{user.phone}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            عضو منذ {new Date(user.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column — Quick links */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            حسابك
          </h2>

          {menuItems.map(({ href, icon: Icon, label, desc, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Icon size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {label}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
              {badge && (
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              )}
              <ChevronLeft size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </Link>
          ))}

          {/* Vendor link if applicable */}
          {user.vendorProfile && (
            <Link
              href="/vendor"
              className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Store size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {user.vendorProfile.storeName}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {user.vendorProfile.status === "approved"
                    ? "لوحة تحكم المتجر"
                    : user.vendorProfile.status === "pending"
                    ? "متجرك قيد المراجعة"
                    : "المتجر موقوف"}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.vendorProfile.status === "approved"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : user.vendorProfile.status === "pending"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}
              >
                {user.vendorProfile.status === "approved"
                  ? "نشط"
                  : user.vendorProfile.status === "pending"
                  ? "قيد المراجعة"
                  : "موقوف"}
              </span>
              <ChevronLeft size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
            </Link>
          )}
        </div>

        {/* Right column — Account info card */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} />
              بيانات الحساب
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">الاسم</p>
                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">البريد الإلكتروني</p>
                <p className="font-semibold text-slate-900 dark:text-white break-all">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-slate-500 text-xs mb-1">رقم الهاتف</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500 text-xs mb-1">نوع الحساب</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">
                  {user.role === "customer" ? "عميل" : user.role === "vendor" ? "تاجر" : "مدير"}
                </p>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 font-medium text-sm"
            >
              <LogOut size={18} />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
