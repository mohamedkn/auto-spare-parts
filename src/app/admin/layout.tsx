import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getUserSession();
  if (!session || session.role !== "admin") redirect("/");

  const navItems = [
    { href: "/admin", label: "نظرة عامة", icon: "dashboard" as const },
    { href: "/admin/orders", label: "إدارة الطلبات", icon: "orders" as const },
    { href: "/admin/vendors", label: "المتاجر والتجار", icon: "vendors" as const },
    { href: "/admin/inquiries", label: "مراجعة طلبات التسعير", icon: "catalog" as const },
    { href: "/products", label: "مراجعة الكتالوج", icon: "catalog" as const },
  ];

  return <DashboardShell kind="admin" title="مركز الإدارة" subtitle="AutoParts Pro" navItems={navItems}>{children}</DashboardShell>;
}
