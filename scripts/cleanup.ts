import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of test data...');

  // Find Test Products
  const testProducts = await prisma.product.findMany({
    where: { name: { startsWith: 'Test' } },
    select: { id: true },
  });
  const productIds = testProducts.map(p => p.id);

  if (productIds.length > 0) {
    console.log(`Found ${productIds.length} Test Products. Deleting related data...`);

    // Find related OrderItems
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { subOrderId: true },
    });

    const subOrderIds = [...new Set(orderItems.map(item => item.subOrderId))];

    // Find Orders related to SubOrders
    const subOrders = await prisma.subOrder.findMany({
      where: { id: { in: subOrderIds } },
      select: { orderId: true },
    });
    const orderIds = [...new Set(subOrders.map(so => so.orderId))];

    // Delete DeliveryJobs for these SubOrders
    if (subOrderIds.length > 0) {
      await prisma.deliveryJob.deleteMany({
        where: { subOrderId: { in: subOrderIds } },
      });
      console.log('Deleted related DeliveryJobs.');
    }

    // Delete OrderItems
    await prisma.orderItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log('Deleted related OrderItems.');

    // Delete SubOrders
    if (subOrderIds.length > 0) {
      await prisma.subOrder.deleteMany({
        where: { id: { in: subOrderIds } },
      });
      console.log('Deleted related SubOrders.');
    }

    // Delete Payments for Orders
    if (orderIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      console.log('Deleted related Payments.');
    }

    // Delete Orders
    if (orderIds.length > 0) {
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
      console.log('Deleted related Orders.');
    }

    // Finally, Delete Test Products
    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });
    console.log(`Deleted ${deletedProducts.count} Test Products.`);
  }

  // Delete Test Categories
  const deletedCategories = await prisma.category.deleteMany({
    where: { name: { startsWith: 'Test' } },
  });
  console.log(`Deleted ${deletedCategories.count} Test Categories.`);

  console.log('Cleanup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
