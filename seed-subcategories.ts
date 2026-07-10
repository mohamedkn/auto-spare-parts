import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding subcategories to Electronics...");

  const electronics = await prisma.category.findUnique({
    where: { slug: "electronics" }
  });

  if (!electronics) {
    console.log("Electronics category not found.");
    return;
  }

  // Create Subcategories
  const subCategories = [
    { name: "موبايلات", slug: "mobiles", parentId: electronics.id },
    { name: "أجهزة اللابتوب", slug: "laptops", parentId: electronics.id },
    { name: "تلفزيونات", slug: "tvs", parentId: electronics.id },
    { name: "سماعات", slug: "headphones", parentId: electronics.id },
  ];

  for (const sub of subCategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: sub,
    });
  }

  console.log("Subcategories added.");

  // Get vendor
  const vendor = await prisma.vendor.findFirst();
  if (!vendor) return;

  const mobilesCat = await prisma.category.findUnique({ where: { slug: "mobiles" } });
  const laptopsCat = await prisma.category.findUnique({ where: { slug: "laptops" } });

  // Move existing products to subcategories for testing
  if (mobilesCat) {
    await prisma.product.updateMany({
      where: { categoryId: electronics.id, name: { contains: "موبايل" } },
      data: { categoryId: mobilesCat.id }
    });
    // Create dummy mobiles
    for (let i = 1; i <= 5; i++) {
       await prisma.product.create({
         data: {
           name: `موبايل ذكي ${i}`,
           slug: `smart-mobile-${i}-${Date.now()}`,
           description: "موبايل بمواصفات عالية",
           price: 5000 + (i * 1000),
           stockQuantity: 10,
           categoryId: mobilesCat.id,
           vendorId: vendor.id,
           images: {
             create: [{ url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500&auto=format&fit=crop" }]
           }
         }
       })
    }
  }

  if (laptopsCat) {
    await prisma.product.updateMany({
      where: { categoryId: electronics.id, name: { contains: "لابتوب" } },
      data: { categoryId: laptopsCat.id }
    });
    // Create dummy laptops
    for (let i = 1; i <= 4; i++) {
       await prisma.product.create({
         data: {
           name: `لابتوب العاب ${i}`,
           slug: `gaming-laptop-${i}-${Date.now()}`,
           description: "لابتوب قوي",
           price: 25000 + (i * 2000),
           stockQuantity: 5,
           categoryId: laptopsCat.id,
           vendorId: vendor.id,
           images: {
             create: [{ url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=500&auto=format&fit=crop" }]
           }
         }
       })
    }
  }

  console.log("Done adding dummy data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
