import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("جاري إنشاء حساب مندوب تجريبي...");
  const passwordHash = await bcrypt.hash("password123", 12);
  
  // Check if exists
  let user = await prisma.user.findUnique({
    where: { email: "driver@example.com" }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "مندوب تجريبي",
        email: "driver@example.com",
        phone: "01111111111",
        passwordHash,
        role: "driver",
        driverProfile: {
          create: {
            vehicleType: "motorcycle",
            maxWeightCapacityKg: 50,
            status: "online",
            isVerified: true,
            cashLimit: 1000
          }
        }
      },
      include: {
        driverProfile: true
      }
    });
    console.log("تم إنشاء المندوب بنجاح!");
  } else {
    console.log("الحساب موجود بالفعل.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
