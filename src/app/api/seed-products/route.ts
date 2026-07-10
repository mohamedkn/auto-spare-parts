import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils/slug";
import { requireRole } from "@/lib/auth/middleware";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-response";

const autoParts = [
  { name: "تيل فرامل أمامي سيراميك بوش", brand: "Bosch", price: 850, oemNumber: "0986494000", imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80", categorySlug: "brake-systems" },
  { name: "مساعدين أمامية ياباني KYB", brand: "KYB", price: 2400, oemNumber: "339031", imageUrl: "https://images.unsplash.com/photo-1502877338535-34cb0c9fb609?w=800&q=80", categorySlug: "suspension-steering" },
  { name: "فلتر زيت أصلي تويوتا", brand: "Toyota", price: 150, oemNumber: "90915-YZZD2", imageUrl: "https://images.unsplash.com/photo-1632823471565-1ec2a759a2bb?w=800&q=80", categorySlug: "filters" },
  { name: "زيت محرك كاسترول إيدج 5W-40 تخليقي بالكامل", brand: "Castrol", price: 1250, oemNumber: "1535C5", imageUrl: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80", categorySlug: "oils-fluids" },
  { name: "رادياتير ألومنيوم فاليو الأصلي", brand: "Valeo", price: 3200, oemNumber: "732000", imageUrl: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80", categorySlug: "cooling-ac" },
  { name: "طقم بوجيهات ليزر إيريديوم NGK", brand: "NGK", price: 950, oemNumber: "IZFR6K-11", imageUrl: "https://images.unsplash.com/photo-1530906358829-e84b2769270f?w=800&q=80", categorySlug: "engine-parts" },
  { name: "مقص أمامي يمين أصلي", brand: "CTR", price: 1800, oemNumber: "CQ0101R", imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80", categorySlug: "suspension-steering" },
  { name: "مبات ليد Philips Ultinon أمامية H7", brand: "Philips", price: 1400, oemNumber: "11972U90CWX2", imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80", categorySlug: "lighting-electrical" },
  { name: "طنبورة فرامل خلفية Textar", brand: "Textar", price: 1100, oemNumber: "92120000", imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80", categorySlug: "brake-systems" },
  { name: "ماء رادياتير أحمر أصلي G12", brand: "Hepu", price: 350, oemNumber: "P999-G12", imageUrl: "https://images.unsplash.com/photo-1616423641402-f8c5b04bc53a?w=800&q=80", categorySlug: "oils-fluids" },
  { name: "فلتر هواء رياضي K&N", brand: "K&N", price: 2100, oemNumber: "33-2200", imageUrl: "https://images.unsplash.com/photo-1600705694295-88e9bb3e3a4e?w=800&q=80", categorySlug: "filters" },
  { name: "دينامو كهرباء 120 أمبير Denso", brand: "Denso", price: 4500, oemNumber: "104210-3440", imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80", categorySlug: "lighting-electrical" },
  { name: "سير كاتينة دايس أصلي", brand: "Gates", price: 650, oemNumber: "5600XS", imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80", categorySlug: "engine-parts" },
  { name: "طرمبة بنزين بوش أصلية", brand: "Bosch", price: 1950, oemNumber: "0986580000", imageUrl: "https://images.unsplash.com/photo-1626081395995-17726b23d902?w=800&q=80", categorySlug: "engine-parts" },
  { name: "مرايا جانبية يمين تايواني", brand: "TYC", price: 850, oemNumber: "301-0001-R", imageUrl: "https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=800&q=80", categorySlug: "body-accessories" }
];

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "admin");

    const products = await prisma.product.findMany();
    if (products.length === 0) return errorResponse("لا توجد منتجات لتحديثها", 404);
    
    const categories = await prisma.category.findMany();
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const newPart = autoParts[i % autoParts.length];
      const targetCategory = categories.find(c => c.slug === newPart.categorySlug);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          name: newPart.name,
          slug: generateSlug(newPart.name) + "-" + Date.now().toString().slice(-4),
          description: `أفضل وأجود أنواع ${newPart.name} من ماركة ${newPart.brand}. متوافق مع السيارات ومطابق لمعايير الجودة العالمية. رقم القطعة: ${newPart.oemNumber}`,
          price: newPart.price,
          oemNumber: newPart.oemNumber,
          brand: newPart.brand,
          categoryId: targetCategory ? targetCategory.id : null,
        }
      });

      const image = await prisma.productImage.findFirst({ where: { productId: product.id } });
      if (image) {
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: newPart.imageUrl }
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: newPart.imageUrl,
            position: 0
          }
        });
      }
    }
    return successResponse({ message: "تم تحديث المنتجات", count: products.length });
  } catch (error) {
    return handleApiError(error);
  }
}
