const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.category.updateMany({
    where: { slug: 'engine-parts' },
    data: { imageUrl: '/images/categories/engine.png' }
  });
  await prisma.category.updateMany({
    where: { slug: 'body-accessories' },
    data: { imageUrl: '/images/categories/body.png' }
  });
  await prisma.category.updateMany({
    where: { slug: 'batteries' },
    data: { imageUrl: '/images/categories/batteries.png' }
  });
  console.log('Reverted to local images!');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
