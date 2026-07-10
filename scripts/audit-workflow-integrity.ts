import { prisma } from "../src/lib/db";
import { DELIVERY_FEE_EGP } from "../src/lib/delivery/pricing";

type Finding = {
  code: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

const closeEnough = (left: number, right: number) => Math.abs(left - right) <= 0.01;

async function main() {
  const [orders, drivers, transactions, products, notifications, carts] = await Promise.all([
    prisma.order.findMany({
      include: {
        payments: true,
        subOrders: {
          include: {
            deliveryJob: true,
            payout: true,
          },
        },
      },
    }),
    prisma.deliveryDriver.findMany(),
    prisma.walletTransaction.findMany(),
    prisma.product.findMany({ select: { id: true, name: true, stockQuantity: true } }),
    prisma.notification.count(),
    prisma.cart.count(),
  ]);

  const findings: Finding[] = [];
  const allSubOrders = orders.flatMap((order) => order.subOrders);

  for (const order of orders) {
    const expectedOrderTotal = order.subOrders.reduce(
      (total, subOrder) => total + Number(subOrder.subtotal) + DELIVERY_FEE_EGP,
      0,
    );
    if (!closeEnough(Number(order.totalAmount), expectedOrderTotal)) {
      findings.push({
        code: "ORDER_TOTAL_MISMATCH",
        entityId: order.id,
        details: { orderNumber: order.orderNumber, actual: Number(order.totalAmount), expected: expectedOrderTotal },
      });
    }

    for (const payment of order.payments) {
      if (!closeEnough(Number(payment.amount), Number(order.totalAmount))) {
        findings.push({ code: "PAYMENT_AMOUNT_MISMATCH", entityId: payment.id, details: { orderNumber: order.orderNumber } });
      }
      if (payment.status === "succeeded" && order.paymentStatus !== "paid") {
        findings.push({
          code: "PAYMENT_SUCCEEDED_ORDER_NOT_PAID",
          entityId: order.id,
          details: { orderNumber: order.orderNumber, orderStatus: order.paymentStatus },
        });
      }
    }

    if (order.paymentStatus === "paid" && !order.payments.some((payment) => payment.status === "succeeded")) {
      findings.push({ code: "ORDER_PAID_WITHOUT_SUCCEEDED_PAYMENT", entityId: order.id, details: { orderNumber: order.orderNumber } });
    }

    for (const subOrder of order.subOrders) {
      const splitTotal = Number(subOrder.commissionAmount) + Number(subOrder.vendorPayoutAmount);
      if (!closeEnough(splitTotal, Number(subOrder.subtotal))) {
        findings.push({ code: "SUBORDER_FINANCIAL_SPLIT_MISMATCH", entityId: subOrder.id });
      }

      const job = subOrder.deliveryJob;
      if (subOrder.status === "delivered" && !order.payments.some((payment) => payment.status === "succeeded")) {
        findings.push({ code: "DELIVERED_SUBORDER_WITHOUT_SUCCEEDED_PAYMENT", entityId: subOrder.id });
      }
      if (subOrder.status === "delivered" && job?.status !== "delivered") {
        findings.push({
          code: "SUBORDER_DELIVERED_JOB_NOT_DELIVERED",
          entityId: subOrder.id,
          details: { jobStatus: job?.status ?? null },
        });
      }
      if (job?.status === "delivered" && subOrder.status !== "delivered") {
        findings.push({
          code: "JOB_DELIVERED_SUBORDER_NOT_DELIVERED",
          entityId: subOrder.id,
          details: { subOrderStatus: subOrder.status },
        });
      }

      if (job) {
        const expectedCodAmount = job.isCod ? Number(subOrder.subtotal) + DELIVERY_FEE_EGP : 0;
        if (!closeEnough(Number(job.codAmountToCollect), expectedCodAmount)) {
          findings.push({
            code: "DELIVERY_COD_AMOUNT_MISMATCH",
            entityId: job.id,
            details: { actual: Number(job.codAmountToCollect), expected: expectedCodAmount },
          });
        }

        if (job.status === "delivered") {
          const jobTransactions = transactions.filter((transaction) => transaction.relatedDeliveryJobId === job.id);
          if (!jobTransactions.some((transaction) => transaction.walletOwnerType === "driver" && transaction.type === "credit")) {
            findings.push({ code: "MISSING_DRIVER_EARNING_TRANSACTION", entityId: job.id });
          }
          if (!jobTransactions.some((transaction) => transaction.walletOwnerType === "platform" && transaction.type === "credit")) {
            findings.push({ code: "MISSING_PLATFORM_EARNING_TRANSACTION", entityId: job.id });
          }
          if (job.isCod && !jobTransactions.some((transaction) => transaction.walletOwnerType === "driver" && transaction.type === "cod_collected")) {
            findings.push({ code: "MISSING_COD_COLLECTION_TRANSACTION", entityId: job.id });
          }
        }
      }

      if (subOrder.payout) {
        if (!closeEnough(Number(subOrder.payout.amount), Number(subOrder.vendorPayoutAmount)) || subOrder.status !== "delivered") {
          findings.push({ code: "PAYOUT_NOT_ALIGNED_WITH_SUBORDER", entityId: subOrder.payout.id });
        }
      }
    }
  }

  for (const driver of drivers) {
    const activeJobs = allSubOrders.filter(
      (subOrder) => subOrder.deliveryJob?.driverId === driver.id
        && ["accepted", "picked_up", "on_the_way"].includes(subOrder.deliveryJob.status),
    ).length;
    if (driver.status === "busy" && activeJobs === 0) {
      findings.push({ code: "DRIVER_STUCK_BUSY_WITHOUT_ACTIVE_JOB", entityId: driver.id });
    }
    if (activeJobs > 0 && driver.status !== "busy") {
      findings.push({ code: "ACTIVE_JOB_DRIVER_NOT_BUSY", entityId: driver.id, details: { status: driver.status, activeJobs } });
    }
  }

  for (const product of products) {
    if (product.stockQuantity < 0) {
      findings.push({ code: "NEGATIVE_PRODUCT_STOCK", entityId: product.id, details: { name: product.name, stock: product.stockQuantity } });
    }
  }

  const counts = {
    orders: orders.length,
    subOrders: allSubOrders.length,
    payments: orders.reduce((count, order) => count + order.payments.length, 0),
    deliveryJobs: allSubOrders.filter((subOrder) => subOrder.deliveryJob).length,
    payouts: allSubOrders.filter((subOrder) => subOrder.payout).length,
    drivers: drivers.length,
    walletTransactions: transactions.length,
    products: products.length,
    notifications,
    carts,
  };

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), counts, findings }, null, 2));
  if (findings.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
