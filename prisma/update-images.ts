import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryImages: Record<string, string> = {
  "brake-systems": "/images/categories/brakes.png",
  "suspension-steering": "/images/categories/suspension.png",
  "filters": "/images/categories/filters.png",
  "oils-fluids": "/images/categories/oils.png",
  "cooling-ac": "/images/categories/cooling.png",
  "lighting-electrical": "/images/categories/lighting.png",
};

async function main() {
  console.log("تحديث صور الأقسام للصور المحلية الجديدة المخصصة...");

  for (const [slug, imageUrl] of Object.entries(categoryImages)) {
    await prisma.category.updateMany({
      where: { slug },
      data: { imageUrl },
    });
    console.log(`تم تحديث صورة القسم: ${slug}`);
  }

  console.log("تم تحديث الصور بنجاح!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
