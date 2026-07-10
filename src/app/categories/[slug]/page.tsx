import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { CategoryHub } from "@/components/categories/CategoryHub";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug: slug },
    select: { name: true, description: true },
  });

  if (!category) return { title: "الفئة غير موجودة" };

  return {
    title: `${category.name} | متجرنا`,
    description: category.description || `تسوق أحدث المنتجات من قسم ${category.name}`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug: slug },
    include: {
      children: {
        include: {
          products: {
            where: { status: "active", vendor: { status: "approved" } },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              images: true,
              reviews: { select: { rating: true } },
            }
          }
        }
      }
    }
  });

  if (!category) {
    notFound();
  }

  // If leaf category (no children), redirect to the main products page with the category filter applied
  if (category.children.length === 0) {
    redirect(`/products?categoryId=${category.id}`);
  }

  // Formatting products inside children for the carousel
  const formattedCategory = {
    ...category,
    children: category.children.map(child => ({
      ...child,
      products: child.products.map(p => {
        const avgRating = p.reviews.length > 0
          ? p.reviews.reduce((acc, curr) => acc + curr.rating, 0) / p.reviews.length
          : 0;
        
        return {
          id: p.id,
          name: p.name,
          title: p.name,
          slug: p.slug,
          price: Number(p.price),
          images: p.images.map(img => img.url),
          avgRating,
          reviewsCount: p.reviews.length,
          inStock: p.stockQuantity > 0,
        };
      })
    }))
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CategoryHub category={formattedCategory} />
    </div>
  );
}
