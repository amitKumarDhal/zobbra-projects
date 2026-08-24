import { prisma } from './config/index.js';

async function auditDB() {
  try {
    const users = await prisma.user.count();
    const companies = await prisma.company.count();
    const categories = await prisma.category.count();
    const products = await prisma.product.count();
    const productVariants = await prisma.productVariant.count();
    const bulkPricings = await prisma.bulkPricing.count();
    const quotes = await prisma.quote.count();
    const quoteItems = await prisma.quoteItem.count();
    const quoteActivities = await prisma.quoteActivity.count();
    const orders = await prisma.order.count();
    const orderItems = await prisma.orderItem.count();
    const productionJobs = await prisma.productionJob.count();
    const dispatches = await prisma.dispatch.count();
    const invoices = await prisma.invoice.count();
    const payments = await prisma.payment.count();
    const cmsContents = await prisma.cMSContent.count();
    const systemSettings = await prisma.systemSetting.count();

    console.log('--- DATABASE AUDIT RESULTS ---');
    console.log(`User: ${users}`);
    console.log(`Company: ${companies}`);
    console.log(`Category: ${categories}`);
    console.log(`Product: ${products}`);
    console.log(`ProductVariant: ${productVariants}`);
    console.log(`BulkPricing: ${bulkPricings}`);
    console.log(`Quote: ${quotes}`);
    console.log(`QuoteItem: ${quoteItems}`);
    console.log(`QuoteActivity: ${quoteActivities}`);
    console.log(`Order: ${orders}`);
    console.log(`OrderItem: ${orderItems}`);
    console.log(`ProductionJob: ${productionJobs}`);
    console.log(`Dispatch: ${dispatches}`);
    console.log(`Invoice: ${invoices}`);
    console.log(`Payment: ${payments}`);
    console.log(`CMSContent: ${cmsContents}`);
    console.log(`SystemSetting: ${systemSettings}`);

    const sampleUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log('Users sample:', JSON.stringify(sampleUsers));

    const sampleQuotes = await prisma.quote.findMany({ take: 3, select: { id: true, quoteNumber: true, status: true, totalAmount: true } });
    console.log('Quotes sample:', JSON.stringify(sampleQuotes));

    const sampleOrders = await prisma.order.findMany({ take: 3, select: { id: true, orderNumber: true, status: true, paymentStatus: true } });
    console.log('Orders sample:', JSON.stringify(sampleOrders));

  } catch (err) {
    console.error('DB Audit Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

auditDB();
