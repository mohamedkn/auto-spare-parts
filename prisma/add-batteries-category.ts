import { PrismaClient } from "@prisma/client";
import { generateSlug } from "../src/lib/utils/slug";

const prisma = new PrismaClient();

async function main() {
  const name = "البطاريات";
  const slug = generateSlug(name) || "batteries";

  // Check if it already exists
  let category = await prisma.category.findUnique({
    where: { slug }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        slug,
        description: "بطاريات سيارات بجميع المقاسات والأحجام",
        imageUrl: "/images/categories/batteries.png"
      }
    });
    console.log("Created category:", category.name);
  } else {
    console.log("Category already exists:", category.name);
  }

  // Find products that are batteries
  const batteries = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "بطاري" } },
        { description: { contains: "بطاري" } }
      ]
    }
  });

  console.log(`Found ${batteries.length} batteries`);

  // Move them to this new category
  for (const product of batteries) {
    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId: category.id }
    });
    console.log("Moved product to batteries category:", product.name);
  }

  // Create some new battery products to make the category look good
  const vendors = await prisma.vendor.findMany({ take: 1 });
  if (vendors.length > 0) {
    const vendorId = vendors[0].id;
    const newBatteries = [
      {
        name: "بطارية سيارة 70 أمبير كلورايد",
        description: "بطارية سيارة كلورايد 70 أمبير سائلة ممتازة لجميع السيارات.",
        price: 3200,
        oemNumber: "CH-70A",
        brand: "Chloride",
        imageUrl: "https://images.unsplash.com/photo-1620050854492-91a59ce05dc3?q=80&w=600&auto=format&fit=crop"
      },
      {
        name: "بطارية سيارة 55 أمبير هانكوك",
        description: "بطارية هانكوك جافة 55 أمبير كورية أصلية بضمان سنة.",
        price: 2800,
        oemNumber: "HK-55A",
        brand: "Hankook",
        imageUrl: "https://images.unsplash.com/photo-1620050854492-91a59ce05dc3?q=80&w=600&auto=format&fit=crop"
      },
      {
        name: "بطارية سيارة 80 أمبير فارتا",
        description: "بطارية فارتا ألمانية 80 أمبير جافة.",
        price: 4500,
        oemNumber: "Varta-80",
        brand: "Varta",
        imageUrl: "https://images.unsplash.com/photo-1620050854492-91a59ce05dc3?q=80&w=600&auto=format&fit=crop"
      }
    ];

    for (const b of newBatteries) {
      await prisma.product.create({
        data: {
          name: b.name,
          slug: generateSlug(b.name) + "-" + Math.floor(Math.random() * 1000),
          description: b.description,
          price: b.price,
          oemNumber: b.oemNumber,
          brand: b.brand,
          status: "active",
          condition: "new_original",
          categoryId: category.id,
          vendorId: vendorId,
          images: {
            create: [{ url: b.imageUrl, position: 0 }]
          },
          stockQuantity: 10,
        }
      });
      console.log("Created new battery:", b.name);
    }
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
