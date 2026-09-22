import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting customer data cleanup for fresh customer journey testing...');

  // 1. Delete Dispatches
  const dispatches = await prisma.dispatch.deleteMany({});
  console.log(`Deleted ${dispatches.count} dispatches`);

  // 2. Delete Invoices
  const invoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${invoices.count} invoices`);

  // 3. Delete Production Jobs
  const prodJobs = await prisma.productionJob.deleteMany({});
  console.log(`Deleted ${prodJobs.count} production jobs`);

  // 4. Delete Payments
  const payments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${payments.count} payments`);

  // 5. Delete OrderItemVariants & OrderItems
  const orderItemVariants = await prisma.orderItemVariant.deleteMany({});
  console.log(`Deleted ${orderItemVariants.count} order item variants`);
  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${orderItems.count} order items`);

  // 6. Delete Orders
  const orders = await prisma.order.deleteMany({});
  console.log(`Deleted ${orders.count} orders`);

  // 7. Delete QuoteItemVariants, QuoteItems, QuoteActivities
  const quoteItemVariants = await prisma.quoteItemVariant.deleteMany({});
  console.log(`Deleted ${quoteItemVariants.count} quote item variants`);
  const quoteItems = await prisma.quoteItem.deleteMany({});
  console.log(`Deleted ${quoteItems.count} quote items`);
  const quoteActivities = await prisma.quoteActivity.deleteMany({});
  console.log(`Deleted ${quoteActivities.count} quote activities`);

  // 8. Delete Inquiries, InquiryVariants, InquiryActivities
  const inquiryVariants = await prisma.inquiryVariant.deleteMany({});
  console.log(`Deleted ${inquiryVariants.count} inquiry variants`);
  const inquiryActivities = await prisma.inquiryActivity.deleteMany({});
  console.log(`Deleted ${inquiryActivities.count} inquiry activities`);
  const inquiries = await prisma.inquiry.deleteMany({});
  console.log(`Deleted ${inquiries.count} inquiries`);

  // 9. Delete Tasks
  const tasks = await prisma.task.deleteMany({});
  console.log(`Deleted ${tasks.count} tasks`);

  // 10. Delete Quotes
  const quotes = await prisma.quote.deleteMany({});
  console.log(`Deleted ${quotes.count} quotes`);

  // 11. Delete CouponUsages & Testimonials
  const couponUsages = await prisma.couponUsage.deleteMany({});
  console.log(`Deleted ${couponUsages.count} coupon usages`);
  const testimonials = await prisma.testimonial.deleteMany({});
  console.log(`Deleted ${testimonials.count} testimonials`);

  // 12. Delete SystemActivities
  const sysActs = await prisma.systemActivity.deleteMany({});
  console.log(`Deleted ${sysActs.count} system activities`);

  // 13. Delete Customer Users (role = CUSTOMER)
  const customers = await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER',
    },
  });
  console.log(`Deleted ${customers.count} customer accounts`);

  // 14. Clean up any orphaned customer companies (not attached to admin/staff)
  const remainingUsers = await prisma.user.findMany({ select: { companyId: true } });
  const activeCompanyIds = remainingUsers.map(u => u.companyId).filter(Boolean) as string[];
  const orphanedCompanies = await prisma.company.deleteMany({
    where: {
      id: { notIn: activeCompanyIds }
    }
  });
  console.log(`Deleted ${orphanedCompanies.count} customer companies`);

  // Verify remaining staff/admin accounts
  const adminUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('\n✅ Remaining Staff/Admin Accounts:');
  console.log(JSON.stringify(adminUsers, null, 2));

  // Verify remaining active products
  const activeProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, category: { select: { name: true } } }
  });
  console.log('\n✅ Active Products in Catalog:');
  console.log(JSON.stringify(activeProducts, null, 2));

  const finalCounts = {
    customers: await prisma.user.count({ where: { role: 'CUSTOMER' } }),
    quotes: await prisma.quote.count(),
    orders: await prisma.order.count(),
    inquiries: await prisma.inquiry.count(),
  };
  console.log('\n📊 Final Count Status:', finalCounts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
