import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting/updating Classic Corporate Pique Polo T-Shirt product...');

  // 1. Ensure category exists
  let category = await prisma.category.findUnique({
    where: { slug: 't-shirts' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'T-Shirts & Apparel',
        slug: 't-shirts',
        description: 'Premium Customized Polo, Round Neck & V-Neck T-Shirts for Corporate & Events.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      },
    });
  }

  const slug = 'classic-corporate-polo-tshirt';

  const description = `Elevate your corporate identity with our Premium Custom Corporate Pique Polo T-Shirt. Engineered specifically for enterprise uniforms, team gear, event giveaways, and branded corporate gifting, this classic polo blends all-day executive comfort with exceptional durability.

### Key Features & Specifications:
- **Fabric & GSM**: 220–240 GSM heavy-duty 100% Combed Compact Cotton Pique knit fabric. Bio-washed and silicon-softened for a smooth, lint-free surface and superior hand-feel.
- **Tailoring & Construction**: Structured 3-button placket with color-matched pearlized buttons. Reinforced collar with fused interlining and ribbed sleeve cuffs designed to retain their shape wash after wash.
- **Comfort Fit**: Pre-shrunk fabric with reinforced shoulder-to-shoulder taped seams and side slits for unrestricted mobility and enhanced breathability.
- **Custom Branding Ready**: Precision customization available on Left Chest (shown in preview with custom logo area), Right Chest, Both Sleeves, and Full Back.
- **Print & Embroidery Methods**: Supports High-Definition Embroidery, Screen Printing, and HD Digital DTF (Direct-to-Film) transfers with vivid color accuracy.
- **Ideal For**: Executive workwear, startup teams, trade shows, retail & sales fleets, annual tech summits, client welcome kits, and corporate gifting.
- **Care Instructions**: Machine wash cold inside out, tumble dry low, do not bleach. Iron on reverse at medium heat; avoid ironing directly on print or embroidery.
- **Minimum Order Quantity (MOQ)**: 20 Units. Custom packaging and individual polybag packing included.`;

  const images = [
    'https://res.cloudinary.com/e3sasmyr/image/upload/v1790080446/products/custom-corporate-polo-black.jpg',
    '/images/products/classic-black-polo.jpg',
  ];

  // 2. Upsert the product
  const existing = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { slug: { startsWith: `${slug}-deleted-` } },
      ],
    },
  });

  let product;
  if (existing) {
    // Delete existing variants and pricing to re-seed cleanly
    await prisma.productVariant.deleteMany({ where: { productId: existing.id } });
    await prisma.bulkPricing.deleteMany({ where: { productId: existing.id } });

    product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: 'Classic Corporate Pique Polo T-Shirt',
        slug,
        hsnCode: '6105',
        gstRate: 5.0,
        description,
        basePrice: 299.0,
        images,
        categoryId: category.id,
        isActive: true,
        requiresColor: true,
        requiresSize: true,
        supportsVariantMatrix: true,
      },
    });
  } else {
    product = await prisma.product.create({
      data: {
        name: 'Classic Corporate Pique Polo T-Shirt',
        slug,
        hsnCode: '6105',
        gstRate: 5.0,
        description,
        basePrice: 299.0,
        images,
        categoryId: category.id,
        isActive: true,
        requiresColor: true,
        requiresSize: true,
        supportsVariantMatrix: true,
      },
    });
  }

  // 3. Create Variants
  const variantsData = [
    { color: 'Charcoal Black', size: 'S', sku: 'ZOB-POLO-BLK-S', stock: 250 },
    { color: 'Charcoal Black', size: 'M', sku: 'ZOB-POLO-BLK-M', stock: 500 },
    { color: 'Charcoal Black', size: 'L', sku: 'ZOB-POLO-BLK-L', stock: 600 },
    { color: 'Charcoal Black', size: 'XL', sku: 'ZOB-POLO-BLK-XL', stock: 450 },
    { color: 'Charcoal Black', size: 'XXL', sku: 'ZOB-POLO-BLK-XXL', stock: 300 },
    { color: 'Navy Blue', size: 'M', sku: 'ZOB-POLO-NVY-M', stock: 350 },
    { color: 'Navy Blue', size: 'L', sku: 'ZOB-POLO-NVY-L', stock: 400 },
    { color: 'Navy Blue', size: 'XL', sku: 'ZOB-POLO-NVY-XL', stock: 300 },
    { color: 'Classic White', size: 'M', sku: 'ZOB-POLO-WHT-M', stock: 250 },
    { color: 'Classic White', size: 'L', sku: 'ZOB-POLO-WHT-L', stock: 300 },
    { color: 'Classic White', size: 'XL', sku: 'ZOB-POLO-WHT-XL', stock: 200 },
  ];

  for (const v of variantsData) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        color: v.color,
        size: v.size,
        sku: v.sku,
        stock: v.stock,
      },
    });
  }

  // 4. Create Bulk Pricing Tiers
  const pricingData = [
    { minQuantity: 20, maxQuantity: 49, pricePerUnit: 299.0, printType: 'Front Only' },
    { minQuantity: 50, maxQuantity: 99, pricePerUnit: 279.0, printType: 'Front Only' },
    { minQuantity: 100, maxQuantity: 199, pricePerUnit: 259.0, printType: 'Front Only' },
    { minQuantity: 200, maxQuantity: 499, pricePerUnit: 239.0, printType: 'Front Only' },
    { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 219.0, printType: 'Front Only' },
    { minQuantity: 20, maxQuantity: 49, pricePerUnit: 349.0, printType: 'Front & Back' },
    { minQuantity: 50, maxQuantity: 199, pricePerUnit: 319.0, printType: 'Front & Back' },
    { minQuantity: 200, maxQuantity: 9999, pricePerUnit: 289.0, printType: 'Front & Back' },
    { minQuantity: 20, maxQuantity: 49, pricePerUnit: 329.0, printType: 'Embroidery' },
    { minQuantity: 50, maxQuantity: 199, pricePerUnit: 299.0, printType: 'Embroidery' },
    { minQuantity: 200, maxQuantity: 9999, pricePerUnit: 269.0, printType: 'Embroidery' },
  ];

  for (const p of pricingData) {
    await prisma.bulkPricing.create({
      data: {
        productId: product.id,
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        pricePerUnit: p.pricePerUnit,
        printType: p.printType,
      },
    });
  }

  console.log(`✅ Successfully added product "${product.name}" (${product.id}) with ${variantsData.length} variants and ${pricingData.length} pricing tiers!`);
}

main()
  .catch((e) => {
    console.error('Error inserting polo product:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
