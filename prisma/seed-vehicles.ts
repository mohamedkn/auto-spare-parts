import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const makes = [
    {
      name: 'BMW',
      slug: 'bmw',
      models: [
        { name: '3 Series', slug: 'bmw-3-series', startYear: 1975, endYear: null },
        { name: '5 Series', slug: 'bmw-5-series', startYear: 1972, endYear: null },
        { name: 'X5', slug: 'bmw-x5', startYear: 1999, endYear: null },
      ]
    },
    {
      name: 'Skoda',
      slug: 'skoda',
      models: [
        { name: 'Octavia', slug: 'skoda-octavia', startYear: 1996, endYear: null },
        { name: 'Superb', slug: 'skoda-superb', startYear: 2001, endYear: null },
        { name: 'Kodiaq', slug: 'skoda-kodiaq', startYear: 2016, endYear: null },
      ]
    },
    {
      name: 'Toyota',
      slug: 'toyota',
      models: [
        { name: 'Corolla', slug: 'toyota-corolla', startYear: 1966, endYear: null },
        { name: 'Camry', slug: 'toyota-camry', startYear: 1982, endYear: null },
        { name: 'Hilux', slug: 'toyota-hilux', startYear: 1968, endYear: null },
      ]
    },
    {
      name: 'Hyundai',
      slug: 'hyundai',
      models: [
        { name: 'Elantra', slug: 'hyundai-elantra', startYear: 1990, endYear: null },
        { name: 'Tucson', slug: 'hyundai-tucson', startYear: 2004, endYear: null },
        { name: 'Sonata', slug: 'hyundai-sonata', startYear: 1985, endYear: null },
      ]
    }
  ];

  for (const make of makes) {
    const existingMake = await prisma.vehicleMake.findUnique({ where: { slug: make.slug } });
    if (!existingMake) {
      const newMake = await prisma.vehicleMake.create({
        data: {
          name: make.name,
          slug: make.slug,
          models: {
            create: make.models.map(m => ({
              name: m.name,
              slug: m.slug,
              startYear: m.startYear,
              endYear: m.endYear
            }))
          }
        }
      });
      console.log(`Created ${newMake.name} with ${make.models.length} models.`);
    } else {
      console.log(`${make.name} already exists.`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
