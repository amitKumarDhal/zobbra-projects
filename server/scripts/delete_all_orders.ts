import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  console.log('Connecting to database...');
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${orders.length} order(s) to delete:`);
  for (const o of orders) {
    console.log(`  - Order ${o.orderNumber} (ID: ${o.id}, Status: ${o.status}, Total: ${o.totalAmount})`);
  }

  if (orders.length === 0) {
    console.log('No orders to delete.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Unlink tasks pointing to orders
    const tasksUpdated = await tx.task.updateMany({
      where: { orderId: { not: null } },
      data: { orderId: null },
    });

    // 2. Delete legacy design_versions if table exists
    const hasDesignVersions = await tx.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT to_regclass('public."design_versions"') IS NOT NULL AS "exists"`
    );
    let designVersionsDeleted = 0;
    if (hasDesignVersions[0]?.exists) {
      designVersionsDeleted = await tx.$executeRawUnsafe(`DELETE FROM "design_versions"`);
    }

    // 3. Delete invoices tied to orders
    const invoices = await tx.invoice.deleteMany({});

    // 4. Delete dispatches
    const dispatches = await tx.dispatch.deleteMany({});

    // 5. Delete production jobs
    const productionJobs = await tx.productionJob.deleteMany({});

    // 6. Delete payments
    const payments = await tx.payment.deleteMany({});

    // 7. Delete order item variants if table exists
    let orderItemVariantsCount = 0;
    try {
      const orderItemVariants = await (tx as any).orderItemVariant.deleteMany({});
      orderItemVariantsCount = orderItemVariants.count;
    } catch {
      // table might not exist in client
    }

    // 8. Delete order items
    const orderItems = await tx.orderItem.deleteMany({});

    // 9. Delete all orders
    const deletedOrders = await tx.order.deleteMany({});

    return {
      tasksUnlinked: tasksUpdated.count,
      designVersions: designVersionsDeleted,
      invoices: invoices.count,
      dispatches: dispatches.count,
      productionJobs: productionJobs.count,
      payments: payments.count,
      orderItemVariants: orderItemVariantsCount,
      orderItems: orderItems.count,
      orders: deletedOrders.count,
    };
  });

  console.log('\n--- Deletion Summary ---');
  console.log(`Orders deleted: ${result.orders}`);
  console.log(`Order items deleted: ${result.orderItems}`);
  console.log(`Invoices deleted: ${result.invoices}`);
  console.log(`Production jobs deleted: ${result.productionJobs}`);
  console.log(`Dispatches deleted: ${result.dispatches}`);
  console.log(`Payments deleted: ${result.payments}`);
  console.log(`Tasks unlinked: ${result.tasksUnlinked}`);

  const remaining = await prisma.order.count();
  console.log(`\nRemaining orders in database: ${remaining}`);
  if (remaining === 0) {
    console.log('✅ ALL ORDERS SUCCESSFULLY DELETED.');
  } else {
    console.error('❌ Warning: Some orders still remain!');
  }
}

main()
  .catch((e) => {
    console.error('Failed to delete orders:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
