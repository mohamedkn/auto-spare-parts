const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.category.updateMany({
    where: { slug: 'engine-parts' },
    data: { imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80' }
  });
  await prisma.category.updateMany({
    where: { slug: 'body-accessories' },
    data: { imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80' }
  });
  console.log('Updated engine and body imageUrl!');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
