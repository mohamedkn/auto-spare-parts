import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for payouts...");

  // Find all sub-orders where there is NO payout record yet,
  // but they might have been marked as paid in our previous logic
  // WAIT: we already removed `payoutStatus` from the schema!
  // Prisma won't let us query `payoutStatus` from SubOrder anymore using Prisma Client.
  
  // So we must execute raw SQL to query the old column if it still exists in the DB.
  
  try {
    const paidSubOrders: any[] = await prisma.$queryRaw`
      SELECT id, vendor_id, vendor_payout_amount, updated_at
      FROM sub_orders
      WHERE payout_status = 'paid' AND id NOT IN (SELECT sub_order_id FROM payouts)
    `;

    console.log(`Found ${paidSubOrders.length} sub-orders with old payout_status = 'paid'`);

    for (const subOrder of paidSubOrders) {
      await prisma.payout.create({
        data: {
          vendorId: subOrder.vendor_id,
          subOrderId: subOrder.id,
          amount: subOrder.vendor_payout_amount,
          status: "paid",
          paidAt: subOrder.updated_at,
        },
      });
      console.log(`Created payout for sub-order ${subOrder.id}`);
    }

    console.log("Backfill completed successfully.");
  } catch (error) {
    console.error("Migration error (maybe column doesn't exist anymore):", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
