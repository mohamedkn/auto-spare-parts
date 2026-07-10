import { PrismaClient } from "@prisma/client";

import { EGYPT_MARKET_CATEGORIES } from "../src/lib/catalog/egypt-auto-parts";

const prisma = new PrismaClient();

async function main() {
  for (const category of EGYPT_MARKET_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: `يشمل: ${category.aliases.slice(0, 8).join("، ")}`,
      },
      update: {
        name: category.name,
        description: `يشمل: ${category.aliases.slice(0, 8).join("، ")}`,
      },
    });
  }
  console.log(`Upserted ${EGYPT_MARKET_CATEGORIES.length} Egyptian market categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
