const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cat = await prisma.category.findUnique({ where: { slug: 'batteries' }, include: { products: true } });
  console.log('Batteries Products Count:', cat.products.length);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
