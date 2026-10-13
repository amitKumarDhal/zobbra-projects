import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  console.log('Connecting to database...');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { name: true } },
      _count: {
        select: {
          variants: true,
          bulkPricing: true,
          quoteItems: true,
          orderItems: true,
          inquiries: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${products.length} product(s) in catalog:`);
  for (const p of products) {
    console.log(`  - ${p.name} (slug: ${p.slug}, id: ${p.id}, category: ${p.category?.name})`);
  }

  if (products.length === 0) {
    console.log('No products to delete.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Unlink inquiries from products
    const inquiriesUpdated = await tx.inquiry.updateMany({
      where: { productId: { not: null } },
      data: { productId: null },
    });

    // 2. Unlink testimonials from products
    const testimonialsUpdated = await tx.testimonial.updateMany({
      where: { productId: { not: null } },
      data: { productId: null },
    });

    // 3. Delete quote items referencing products
    const quoteItemsDeleted = await tx.quoteItem.deleteMany({});

    // 4. Delete order items (if any remain)
    const orderItemsDeleted = await tx.orderItem.deleteMany({});

    // 5. Delete legacy design_drafts if table exists
    const hasDesignDrafts = await tx.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT to_regclass('public."design_drafts"') IS NOT NULL AS "exists"`
    );
    let designDraftsDeleted = 0;
    if (hasDesignDrafts[0]?.exists) {
      designDraftsDeleted = await tx.$executeRawUnsafe(`DELETE FROM "design_drafts"`);
    }

    // 6. Delete bulk pricing
    const bulkPricingDeleted = await tx.bulkPricing.deleteMany({});

    // 7. Delete product variants
    const variantsDeleted = await tx.productVariant.deleteMany({});

    // 8. Delete all products
    const productsDeleted = await tx.product.deleteMany({});

    return {
      inquiriesUnlinked: inquiriesUpdated.count,
      testimonialsUnlinked: testimonialsUpdated.count,
      quoteItems: quoteItemsDeleted.count,
      orderItems: orderItemsDeleted.count,
      designDrafts: designDraftsDeleted,
      bulkPricing: bulkPricingDeleted.count,
      variants: variantsDeleted.count,
      products: productsDeleted.count,
    };
  });

  console.log('\n--- Products Deletion Summary ---');
  console.log(`Products deleted: ${result.products}`);
  console.log(`Product variants deleted: ${result.variants}`);
  console.log(`Bulk pricing tiers deleted: ${result.bulkPricing}`);
  console.log(`Quote items deleted: ${result.quoteItems}`);
  console.log(`Order items deleted: ${result.orderItems}`);
  console.log(`Inquiries unlinked: ${result.inquiriesUnlinked}`);
  console.log(`Testimonials unlinked: ${result.testimonialsUnlinked}`);

  const remaining = await prisma.product.count();
  console.log(`\nRemaining products in database: ${remaining}`);
  if (remaining === 0) {
    console.log('✅ ALL PRODUCTS SUCCESSFULLY DELETED.');
  } else {
    console.error('❌ Warning: Some products still remain!');
  }
}

main()
  .catch((e) => {
    console.error('Failed to delete products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
