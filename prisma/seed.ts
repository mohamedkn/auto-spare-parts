/**
 * Prisma Seed Script
 * ─────────────────────────────────────
 * يملأ قاعدة البيانات ببيانات تجريبية واقعية:
 * 5 عملاء، 3 متاجر (بـ 3 بائعين)، 15 منتج، وطلبين تجريبيين.
 *
 * للتشغيل: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateSlug } from "../src/lib/utils/slug"; // تأكد من المسار
import { generateOrderNumber } from "../src/lib/utils/order-number";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 جاري تصفير قاعدة البيانات...");

  // مسح البيانات الحالية (عشان لو شغلناه أكتر من مرة ما يعملش errors)
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.subOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 تم المسح. جاري إدخال البيانات الجديدة...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. إنشاء العملاء (5 عملاء)
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const customer = await prisma.user.create({
      data: {
        name: `عميل تجريبي ${i}`,
        email: `customer${i}@example.com`,
        passwordHash,
        phone: `0100000000${i}`,
        role: "customer",
      },
    });
    customers.push(customer);
  }
  console.log(`✅ تم إنشاء ${customers.length} عملاء.`);

  // 2. إنشاء الأدمن
  const admin = await prisma.user.create({
    data: {
      name: "مدير النظام",
      email: "admin@zee.com",
      passwordHash,
      role: "admin",
    },
  });
  console.log(`✅ تم إنشاء الأدمن.`);

  // 3. إنشاء الفئات (Categories)
  const oilsCategory = await prisma.category.create({
    data: { name: "الزيوت والسوائل", slug: "oils-and-fluids", imageUrl: "/images/categories/oils.png" },
  });
  const engineCategory = await prisma.category.create({
    data: { name: "أجزاء المحرك", slug: "engine-parts", imageUrl: "/images/categories/engine.png" },
  });
  const coolingCategory = await prisma.category.create({
    data: { name: "التبريد والتكييف", slug: "cooling-ac", imageUrl: "/images/categories/cooling.png" },
  });
  const bodyCategory = await prisma.category.create({
    data: { name: "الهيكل والإكسسوارات", slug: "body-accessories", imageUrl: "/images/categories/body.png" },
  });
  const filtersCategory = await prisma.category.create({
    data: { name: "الفلاتر", slug: "filters", imageUrl: "/images/categories/filters.png" },
  });
  const electricCategory = await prisma.category.create({
    data: { name: "الإضاءة والكهرباء", slug: "lighting-electrical", imageUrl: "/images/categories/lighting.png" },
  });
  const brakesCategory = await prisma.category.create({
    data: { name: "أنظمة الفرامل", slug: "brake-systems", imageUrl: "/images/categories/brakes.png" },
  });
  const batteriesCategory = await prisma.category.create({
    data: { name: "البطاريات", slug: "batteries", imageUrl: "/images/categories/batteries.png" },
  });
  console.log(`✅ تم إنشاء 8 فئات رئيسية بصور.`);

  // 4. إنشاء البائعين والمتاجر (3 متاجر)
  const vendorData = [
    {
      name: "أحمد موتورز",
      email: "ahmed@motors.com",
      storeName: "المهندس لقطع الغيار",
      desc: "متخصصون في بيع زيوت وفلاتر السيارات.",
    },
    {
      name: "سعيد أوتو",
      email: "saeed@auto.com",
      storeName: "أوتو مارت",
      desc: "أفضل أنواع تيل الفرامل والديسكات.",
    },
    {
      name: "محمود سبيد",
      email: "mahmoud@speed.com",
      storeName: "سرعة المحرك",
      desc: "كل ما يحتاجه محرك سيارتك من قطع غيار.",
    },
  ];

  const vendors = [];
  for (const v of vendorData) {
    const user = await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        passwordHash,
        role: "vendor",
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        ownerId: user.id,
        storeName: v.storeName,
        slug: generateSlug(v.storeName),
        description: v.desc,
        status: "approved", 
        commissionRate: 10.0,
      },
    });
    vendors.push(vendor);
  }
  console.log(`✅ تم إنشاء ${vendors.length} متاجر.`);

  // 5. إنشاء المنتجات (15 منتج: 5 لكل متجر)
  const products = [];

  // متجر 1: زيوت وسوائل وأجزاء المحرك
  for (let i = 1; i <= 3; i++) {
    const name = `زيت محرك تخليقي 10W-40 طراز ${i}`;
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[0].id,
        categoryId: oilsCategory.id,
        name,
        slug: generateSlug(name),
        description: `زيت محرك عالي الجودة يحافظ على أداء المحرك - النسخة ${i}`,
        price: 500 + i * 100,
        stockQuantity: 10 + i,
        status: "active",
        images: { create: [{ url: oilsCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }
  for (let i = 1; i <= 2; i++) {
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[0].id,
        categoryId: engineCategory.id,
        name: `بوجيهات ليزر ايريديوم ${i}`,
        slug: generateSlug(`spark-plugs-${i}`),
        description: "بوجيهات أصلية لعمر أطول",
        price: 400,
        stockQuantity: 20,
        status: "active",
        images: { create: [{ url: engineCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }

  // متجر 2: فلاتر وكهرباء
  for (let i = 1; i <= 3; i++) {
    const name = `فلتر هواء رياضي كربون طراز ${i}`;
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[1].id,
        categoryId: filtersCategory.id,
        name,
        slug: generateSlug(name),
        description: `فلتر هواء عالي الأداء لزيادة عزم السيارة - طراز ${i}`,
        price: 300 + i * 50,
        stockQuantity: 20,
        status: "active",
        images: { create: [{ url: filtersCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }
  for (let i = 1; i <= 2; i++) {
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[1].id,
        categoryId: batteriesCategory.id,
        name: `بطارية سيارة 70 أمبير ${i}`,
        slug: generateSlug(`car-battery-${i}`),
        description: "بطارية جافة بعمر افتراضي طويل",
        price: 2500,
        stockQuantity: 5,
        status: "active",
        images: { create: [{ url: batteriesCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }

  // متجر 3: فرامل ومكابح وهيكل
  for (let i = 1; i <= 3; i++) {
    const name = `تيل فرامل أمامي سيراميك فئة ${i}`;
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[2].id,
        categoryId: brakesCategory.id,
        name,
        slug: generateSlug(name),
        description: `تيل فرامل سيراميك لا يصدر أصوات وعمره الافتراضي طويل - فئة ${i}`,
        price: 800 + i * 150,
        stockQuantity: 15,
        status: "active",
        images: { create: [{ url: brakesCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }
  for (let i = 1; i <= 2; i++) {
    const p = await prisma.product.create({
      data: {
        vendorId: vendors[2].id,
        categoryId: bodyCategory.id,
        name: `اكصدام أمامي رياضي ${i}`,
        slug: generateSlug(`front-bumper-${i}`),
        description: "اكصدام متين ومطابق للمواصفات الأصلية",
        price: 3500,
        stockQuantity: 2,
        status: "active",
        images: { create: [{ url: bodyCategory.imageUrl!, position: 0 }] },
      },
    });
    products.push(p);
  }
  console.log(`✅ تم إنشاء ${products.length} منتجات وتوزيعها على الأقسام.`);

  // 6. إنشاء أوردرات تجريبية
  // الأوردر الأول: العميل 1 يشتري لابتوب وفستان (من متجرين مختلفين)
  const order1Total = Number(products[0].price) * 1 + Number(products[5].price) * 2;
  
  const order1 = await prisma.order.create({
    data: {
      userId: customers[0].id,
      orderNumber: generateOrderNumber(),
      totalAmount: order1Total,
      shippingAddress: {
        fullName: "عميل تجريبي 1",
        phone: "01000000001",
        addressLine1: "شارع التحرير, عمارة 5",
        city: "القاهرة",
        governorate: "القاهرة",
      },
      paymentStatus: "paid",
      subOrders: {
        create: [
          // SubOrder لمتجر الإلكترونيات
          {
            vendorId: vendors[0].id,
            status: "processing",
            subtotal: Number(products[0].price) * 1,
            commissionRateSnapshot: 10.0,
            commissionAmount: (Number(products[0].price) * 1 * 10) / 100,
            vendorPayoutAmount: (Number(products[0].price) * 1 * 90) / 100,
            items: {
              create: [
                {
                  productId: products[0].id,
                  quantity: 1,
                  unitPrice: products[0].price,
                  totalPrice: Number(products[0].price) * 1,
                },
              ],
            },
          },
          // SubOrder لمتجر الأزياء
          {
            vendorId: vendors[1].id,
            status: "shipped",
            subtotal: Number(products[5].price) * 2,
            commissionRateSnapshot: 10.0,
            commissionAmount: (Number(products[5].price) * 2 * 10) / 100,
            vendorPayoutAmount: (Number(products[5].price) * 2 * 90) / 100,
            items: {
              create: [
                {
                  productId: products[5].id,
                  quantity: 2,
                  unitPrice: products[5].price,
                  totalPrice: Number(products[5].price) * 2,
                },
              ],
            },
          },
        ],
      },
      payments: {
        create: [
          {
            provider: "vodafone_cash",
            providerTransactionId: "VC-987654321",
            amount: order1Total,
            status: "succeeded",
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  console.log(`✅ تم إنشاء طلب تجريبي رقم ${order1.orderNumber} (من متجرين مختلفين).`);

  console.log("🎉 تمت عملية الـ Seed بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ حدث خطأ أثناء الـ Seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
