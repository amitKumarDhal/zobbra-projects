import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding 3 flagship products to ZOBBRA database...\n');

  // Categories lookup
  const catTshirts = await prisma.category.findFirst({
    where: { slug: 't-shirts' },
  });
  const catCaps = await prisma.category.findFirst({
    where: { slug: 'caps' },
  });

  if (!catTshirts || !catCaps) {
    throw new Error('Required categories (t-shirts, caps) were not found in the database.');
  }

  // --------------------------------------------------------------------------
  // PRODUCT 1: Classic Corporate Pique Polo T-Shirt
  // --------------------------------------------------------------------------
  const poloSlug = 'classic-corporate-polo-tshirt';
  console.log(`1️⃣ Upserting Polo Product: ${poloSlug}...`);

  const poloColors = [
    { name: 'Charcoal Black', hex: '#111111' },
    { name: 'Navy Blue', hex: '#1E3A8A' },
    { name: 'Classic White', hex: '#FFFFFF' },
  ];
  const poloSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const poloDescription = `Elevate your corporate identity with our Premium Custom Corporate Pique Polo T-Shirt. Engineered specifically for enterprise uniforms, team gear, event giveaways, and branded corporate gifting, this classic polo blends all-day executive comfort with exceptional durability.

### Key Features & Specifications:
- **Fabric & GSM**: 220–240 GSM heavy-duty 100% Combed Compact Cotton Pique knit fabric. Bio-washed and silicon-softened for a smooth, lint-free surface and superior hand-feel.
- **Tailoring & Construction**: Structured 3-button placket with color-matched pearlized buttons. Reinforced collar with fused interlining and ribbed sleeve cuffs designed to retain their shape wash after wash.
- **Comfort Fit**: Pre-shrunk fabric with reinforced shoulder-to-shoulder taped seams and side slits for unrestricted mobility and enhanced breathability.
- **Custom Branding Ready**: Precision customization available on Left Chest, Right Chest, Both Sleeves, and Full Back.
- **Print & Embroidery Methods**: Supports High-Definition Embroidery, Screen Printing, and HD Digital DTF (Direct-to-Film) transfers with vivid color accuracy.
- **Care Instructions**: Machine wash cold inside out, tumble dry low, do not bleach. Iron on reverse at medium heat.
- **MOQ**: 20 Pieces. Individually polybagged.`;

  const existingPolo = await prisma.product.findUnique({ where: { slug: poloSlug } });
  if (existingPolo) {
    await prisma.bulkPricing.deleteMany({ where: { productId: existingPolo.id } });
    await prisma.productVariant.deleteMany({ where: { productId: existingPolo.id } });
    await prisma.product.delete({ where: { id: existingPolo.id } });
  }

  const poloProduct = await prisma.product.create({
    data: {
      name: 'Classic Corporate Pique Polo T-Shirt',
      slug: poloSlug,
      hsnCode: '6105',
      gstRate: 5.0,
      description: poloDescription,
      basePrice: 299.0,
      minOrderQty: 20,
      minSampleQty: 1,
      stockCount: 3150,
      ratingOverride: 4.9,
      reviewCountOverride: 184,
      orderMode: 'BOTH',
      customizationEnabled: true,
      designerEnabled: true,
      customizerTemplateId: 'polo-v1',
      trimColorEnabled: true,
      tapingColorEnabled: true,
      backDesignEnabled: true,
      embroideryEnabled: true,
      isActive: true,
      requiresColor: true,
      requiresSize: true,
      supportsVariantMatrix: true,
      sizes: poloSizes,
      colors: poloColors,
      highlights: [
        '220-240 GSM 100% Combed Cotton Pique',
        'Structured 3-button reinforced placket',
        'Ribbed collar and cuffs with shape retention',
        'Bio-washed and silicon-softened for premium feel',
        'Supports HD embroidery and DTF screen print',
      ],
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790080446/products/custom-corporate-polo-black.jpg',
        '/images/products/classic-black-polo.jpg',
      ],
      categoryId: catTshirts.id,
      freeGift: {
        enabled: true,
        title: 'Custom Brand Swag Stickers',
        description: 'Complimentary high-res waterproof stickers with bulk order',
        minQuantity: 50,
      },
      offerAddon: {
        enabled: true,
        title: 'Individual Premium Gift Box',
        description: 'Rigid magnetic gift packaging for corporate presentation',
        price: 35.0,
        priceType: 'PER_PIECE',
      },
      variants: {
        create: [
          { color: 'Charcoal Black', size: 'S', sku: 'ZOB-POLO-BLK-S', stock: 250 },
          { color: 'Charcoal Black', size: 'M', sku: 'ZOB-POLO-BLK-M', stock: 500 },
          { color: 'Charcoal Black', size: 'L', sku: 'ZOB-POLO-BLK-L', stock: 600 },
          { color: 'Charcoal Black', size: 'XL', sku: 'ZOB-POLO-BLK-XL', stock: 450 },
          { color: 'Charcoal Black', size: 'XXL', sku: 'ZOB-POLO-BLK-XXL', stock: 300 },
          { color: 'Navy Blue', size: 'S', sku: 'ZOB-POLO-NVY-S', stock: 200 },
          { color: 'Navy Blue', size: 'M', sku: 'ZOB-POLO-NVY-M', stock: 350 },
          { color: 'Navy Blue', size: 'L', sku: 'ZOB-POLO-NVY-L', stock: 400 },
          { color: 'Navy Blue', size: 'XL', sku: 'ZOB-POLO-NVY-XL', stock: 300 },
          { color: 'Classic White', size: 'M', sku: 'ZOB-POLO-WHT-M', stock: 250 },
          { color: 'Classic White', size: 'L', sku: 'ZOB-POLO-WHT-L', stock: 300 },
          { color: 'Classic White', size: 'XL', sku: 'ZOB-POLO-WHT-XL', stock: 200 },
        ],
      },
      bulkPricing: {
        create: [
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 299.0, printType: 'Front Chest Print / Embroidery' },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 279.0, printType: 'Front Chest Print / Embroidery' },
          { minQuantity: 100, maxQuantity: 199, pricePerUnit: 259.0, printType: 'Front Chest Print / Embroidery' },
          { minQuantity: 200, maxQuantity: 499, pricePerUnit: 239.0, printType: 'Front Chest Print / Embroidery' },
          { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 219.0, printType: 'Front Chest Print / Embroidery' },
        ],
      },
    },
  });
  console.log(`✅ Polo created successfully (ID: ${poloProduct.id})\n`);

  // --------------------------------------------------------------------------
  // PRODUCT 2: Classic Promotional Structured Cotton Cap
  // --------------------------------------------------------------------------
  const capSlug = 'classic-promotional-cotton-cap';
  console.log(`2️⃣ Upserting Cap Product: ${capSlug}...`);

  const capColors = [
    { name: 'Charcoal Black', hex: '#111111' },
    { name: 'Navy Blue', hex: '#1E3A8A' },
    { name: 'Classic White', hex: '#FFFFFF' },
    { name: 'Royal Blue', hex: '#2563EB' },
    { name: 'Crimson Red', hex: '#DC2626' },
  ];

  const capDescription = `Premium 6-panel structured baseball cap crafted from 100% heavy brushed cotton twill.

### Key Features & Specifications:
- **Fabric**: 100% Heavy Brushed Compact Cotton Twill for enhanced durability and superior crown shape retention.
- **Structure**: 6-Panel structured design with fused hard buckram interior support preventing collapse.
- **Visor**: Pre-curved visor with 6 rows of contrast/tonal edge stitching.
- **Ventilation**: 6 sewn embroidered eyelets (one per panel) ensuring breathability in all seasons.
- **Sweatband**: Cotton twill interior moisture-wicking sweatband for all-day comfort.
- **Closure**: Adjustable brass metal slide buckle with hidden grommet tuck-in (Free Size / Fits 54cm–60cm circumference).
- **Branding Methods**: Engineered specifically for 3D Puff Embroidery, Flat Embroidery, Woven Badges, and HD DTF Transfer.
- **MOQ**: 20 Pieces. Ideal for corporate merchandise, trade shows, delivery teams, and promotional events.`;

  const existingCap = await prisma.product.findUnique({ where: { slug: capSlug } });
  if (existingCap) {
    await prisma.bulkPricing.deleteMany({ where: { productId: existingCap.id } });
    await prisma.productVariant.deleteMany({ where: { productId: existingCap.id } });
    await prisma.product.delete({ where: { id: existingCap.id } });
  }

  const capProduct = await prisma.product.create({
    data: {
      name: 'Classic Promotional Structured Cotton Cap',
      slug: capSlug,
      hsnCode: '6505',
      gstRate: 5.0,
      description: capDescription,
      basePrice: 149.0,
      minOrderQty: 20,
      minSampleQty: 1,
      stockCount: 1450,
      ratingOverride: 4.8,
      reviewCountOverride: 112,
      orderMode: 'BOTH',
      customizationEnabled: true,
      designerEnabled: true,
      customizerTemplateId: 'cap-v1',
      trimColorEnabled: true,
      tapingColorEnabled: false,
      backDesignEnabled: true,
      embroideryEnabled: true,
      isActive: true,
      requiresColor: true,
      requiresSize: false,
      supportsVariantMatrix: false,
      sizes: ['Free Size'],
      colors: capColors,
      highlights: [
        '100% Heavy Brushed Compact Cotton Twill',
        '6-Panel structured design with hard buckram',
        'Adjustable brass metal slide buckle',
        'Moisture-wicking interior sweatband',
        'Engineered for 3D puff and flat embroidery',
      ],
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790083669/products/classic-cotton-cap-black.jpg',
        '/images/products/classic-cotton-cap.jpg',
      ],
      categoryId: catCaps.id,
      variants: {
        create: [
          { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
          { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
          { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
          { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
          { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
        ],
      },
      bulkPricing: {
        create: [
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 149.0, printType: 'Front 3D Embroidery' },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129.0, printType: 'Front 3D Embroidery' },
          { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109.0, printType: 'Front 3D Embroidery' },
          { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95.0, printType: 'Front 3D Embroidery' },
          { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 85.0, printType: 'Front 3D Embroidery' },
        ],
      },
    },
  });
  console.log(`✅ Cap created successfully (ID: ${capProduct.id})\n`);

  console.log('🎉 Both products have been successfully created and linked with full pricing and variants!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
