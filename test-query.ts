import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const drivers = await prisma.user.findMany({
      where: {
        role: "driver",
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    console.log("Drivers:", drivers);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
