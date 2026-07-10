import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const batteries = await prisma.product.findMany({
    where: {
      name: { contains: "بطاري" }
    },
    include: { images: true }
  });

  const newImageUrl = "/images/categories/batteries.png";

  for (const product of batteries) {
    if (product.images && product.images.length > 0) {
      await prisma.productImage.updateMany({
        where: { productId: product.id },
        data: { url: newImageUrl }
      });
      console.log(`Updated image for ${product.name}`);
    } else {
      await prisma.productImage.create({
        data: {
          url: newImageUrl,
          productId: product.id,
          position: 0
        }
      });
      console.log(`Created image for ${product.name}`);
    }
  }

  console.log("Done updating battery images!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
