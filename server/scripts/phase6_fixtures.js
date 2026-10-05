const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SLUG_FULL = 'phase6-val-full-e2e';
const SLUG_DISABLED = 'phase6-val-disabled-e2e';

async function main() {
  const action = process.argv[2] || 'create';

  const cleanFixtures = async (ids) => {
    if (!ids || ids.length === 0) return;
    const orderItems = await prisma.orderItem.findMany({ where: { productId: { in: ids } }, select: { id: true, orderId: true } });
    const orderItemIds = orderItems.map((oi) => oi.id);
    const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
    if (orderItemIds.length > 0) {
      await prisma.orderItemVariant.deleteMany({ where: { orderItemId: { in: orderItemIds } } });
      await prisma.orderItem.deleteMany({ where: { id: { in: orderItemIds } } });
    }
    if (orderIds.length > 0) {
      await prisma.productionJob.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.invoice.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    await prisma.quoteItem.deleteMany({ where: { productId: { in: ids } } });
    await prisma.quote.deleteMany({ where: { items: { some: { productId: { in: ids } } } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  };

  if (action === 'cleanup') {
    console.log('Cleaning up Phase 6 E2E fixtures...');
    const prods = await prisma.product.findMany({
      where: { slug: { in: [SLUG_FULL, SLUG_DISABLED] } },
      select: { id: true },
    });
    await cleanFixtures(prods.map((p) => p.id));
    console.log('Cleanup finished.');
    return;
  }

  // Action: create
  // Clean first to avoid collision
  const existing = await prisma.product.findMany({
    where: { slug: { in: [SLUG_FULL, SLUG_DISABLED] } },
    select: { id: true },
  });
  await cleanFixtures(existing.map((p) => p.id));

  const category = await prisma.category.findFirst();
  if (!category) throw new Error('No category found');

  const fullProd = await prisma.product.create({
    data: {
      name: 'E2E Phase 6 Full Product',
      slug: SLUG_FULL,
      hsnCode: '6109',
      gstRate: 5.0,
      description: 'Phase 6 validation full features',
      basePrice: 499.0,
      categoryId: category.id,
      isActive: true,
      requiresColor: true,
      requiresSize: true,
      designerEnabled: true,
      customizationEnabled: true,
      customizerTemplateId: 'polo-v1',
      embroideryEnabled: true,
      tapingColorEnabled: true,
      trimColorEnabled: true,
      backDesignEnabled: true,
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Navy Blue', hex: '#1E3A8A' },
        { name: 'Charcoal Black', hex: '#111111' },
      ],
      sizes: ['M', 'L', 'XL'],
      variants: {
        create: [
          { sku: `E2E-FULL-W-M-${Date.now()}`, color: 'White', size: 'M', stock: 100 },
          { sku: `E2E-FULL-W-L-${Date.now()}`, color: 'White', size: 'L', stock: 100 },
        ],
      },
    },
  });

  const disabledProd = await prisma.product.create({
    data: {
      name: 'E2E Phase 6 Disabled Product',
      slug: SLUG_DISABLED,
      hsnCode: '6109',
      gstRate: 5.0,
      description: 'Phase 6 validation disabled features',
      basePrice: 399.0,
      categoryId: category.id,
      isActive: true,
      requiresColor: true,
      requiresSize: true,
      designerEnabled: true,
      customizationEnabled: true,
      customizerTemplateId: 'polo-v1',
      embroideryEnabled: false,
      tapingColorEnabled: false,
      trimColorEnabled: false,
      backDesignEnabled: true,
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Navy Blue', hex: '#1E3A8A' },
      ],
      sizes: ['M', 'L', 'XL'],
      variants: {
        create: [
          { sku: `E2E-DIS-W-M-${Date.now()}`, color: 'White', size: 'M', stock: 100 },
        ],
      },
    },
  });

  console.log(JSON.stringify({
    fullProduct: { id: fullProd.id, slug: fullProd.slug },
    disabledProduct: { id: disabledProd.id, slug: disabledProd.slug },
  }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
