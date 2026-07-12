import { getUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await getUserSession();

  let user: { name: string; role: string } | null = null;
  let cartCount = 0;

  if (session) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, role: true },
      });
      
      if (dbUser) {
        user = dbUser;
      }
    } catch (error) {
      console.error("Database connection error in Navbar:", error);
    }

    // Get cart item count for logged-in users
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: session.userId },
        include: { items: { select: { quantity: true } } },
      });
      cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    } catch (e) {
      console.error("Cart DB error:", e);
    }
  }

  // Get root categories for navigation
  let categories: Array<{ id: string; name: string; slug: string }> = [];
  try {
    categories = await prisma.category.findMany({
      where: { parentId: null },
      take: 8,
      select: { id: true, name: true, slug: true },
    });
  } catch (e) {
    console.error("Categories DB error:", e);
  }

  return (
    <NavbarClient
      user={user}
      cartCount={cartCount}
      categories={categories}
    />
  );
}
