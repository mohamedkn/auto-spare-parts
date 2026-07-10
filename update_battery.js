const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.category.updateMany({
    where: { slug: 'batteries' },
    data: { imageUrl: 'https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&w=800&q=80' }
  });
  console.log('Updated batteries imageUrl!');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
