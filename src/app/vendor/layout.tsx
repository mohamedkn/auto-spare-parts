import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session || session.role !== "vendor") redirect("/");

  const vendor = await prisma.vendor.findUnique({ where: { ownerId: session.userId }, select: { status: true } });
  if (!vendor || vendor.status === "suspended") redirect("/");

  const navItems = [
    { href: "/vendor", label: "نظرة عامة", icon: "dashboard" as const },
    { href: "/vendor/products", label: "المنتجات والمخزون", icon: "products" as const },
    { href: "/vendor/orders", label: "الطلبات", icon: "cart" as const },
    { href: "/vendor/payouts", label: "المحفظة والتسويات", icon: "wallet" as const },
  ];

  return <DashboardShell kind="vendor" title="لوحة التاجر" subtitle="إدارة متجرك بسهولة" navItems={navItems}>{children}</DashboardShell>;
}
