import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const autoPartsCategories = [
  {
    name: "أجزاء المحرك",
    slug: "engine-parts",
    description: "سيور، بساتم، صمامات، طرمبة زيت، ومكونات المحرك الداخلية.",
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80", 
  },
  {
    name: "أنظمة الفرامل",
    slug: "brake-systems",
    description: "تيل فرامل، طنابير، ماستر فرامل، وزيوت الفرامل.",
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  },
  {
    name: "التعليق والتوجيه",
    slug: "suspension-steering",
    description: "مساعدين، مقصات، بارات، وطرمبة دركسيون.",
    imageUrl: "https://images.unsplash.com/photo-1590635583196-189f36f6d899?w=800&q=80",
  },
  {
    name: "الفلاتر",
    slug: "filters",
    description: "فلتر زيت، فلتر هواء، فلتر بنزين، فلتر تكييف.",
    imageUrl: "https://images.unsplash.com/photo-1629815041499-a359c23f2f01?w=800&q=80",
  },
  {
    name: "الزيوت والسوائل",
    slug: "oils-fluids",
    description: "زيوت محرك، مياه تبريد، سوائل هيدروليك.",
    imageUrl: "https://images.unsplash.com/photo-1579848416417-64b595da1f1e?w=800&q=80",
  },
  {
    name: "التبريد والتكييف",
    slug: "cooling-ac",
    description: "ردياتير، كومبريسور، ثرموستات، ومراوح تبريد.",
    imageUrl: "https://images.unsplash.com/photo-1540822602737-147b31e925c4?w=800&q=80",
  },
  {
    name: "الإضاءة والكهرباء",
    slug: "lighting-electrical",
    description: "فوانيس، بطاريات، بوجيهات، دينامو، مارش.",
    imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80",
  },
  {
    name: "الهيكل والإكسسوارات",
    slug: "body-accessories",
    description: "اكصدامات، رفارف، مرايات، كماليات سيارات.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-34cb0c9fb609?w=800&q=80",
  }
];

async function main() {
  console.log("🌱 جاري تحديث الأقسام إلى قطع غيار السيارات...");

  // 1. Get default category ID or create an "Uncategorized" category to move existing products
  let defaultCategory = await prisma.category.findUnique({
    where: { slug: "uncategorized" }
  });

  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: {
        name: "غير مصنف",
        slug: "uncategorized",
        description: "منتجات عامة",
      }
    });
  }

  // 2. Move existing products to the default category so they don't get deleted or orphaned if cascade rules fail
  await prisma.product.updateMany({
    where: {
      categoryId: { not: null }
    },
    data: {
      categoryId: defaultCategory.id
    }
  });

  // 3. Delete old categories except "uncategorized"
  await prisma.category.deleteMany({
    where: {
      slug: { not: "uncategorized" }
    }
  });

  // 4. Insert Auto Parts Categories
  const createdCategories = [];
  for (const cat of autoPartsCategories) {
    const category = await prisma.category.create({
      data: cat,
    });
    createdCategories.push(category);
  }

  console.log(`✅ تم إدراج ${createdCategories.length} أقسام بنجاح.`);

  // 5. Update old products to belong to the new categories to ensure they show up in the UI tests
  const products = await prisma.product.findMany();
  for (let i = 0; i < products.length; i++) {
    const randomCat = createdCategories[i % createdCategories.length];
    await prisma.product.update({
      where: { id: products[i].id },
      data: { categoryId: randomCat.id }
    });
  }
  
  console.log(`✅ تم تحديث تصنيف ${products.length} منتجات لتعمل مع الأقسام الجديدة.`);
  console.log("🎉 تمت العملية بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ حدث خطأ أثناء إدراج الأقسام:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
