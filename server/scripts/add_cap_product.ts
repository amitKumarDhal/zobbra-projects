import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../src/config/index.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'e3sasmyr',
  api_key: process.env.CLOUDINARY_API_KEY || '985661943518836',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yp5_Amms5qVY4UR4dAVNFOiQ_4M',
});

const USER_IMAGE_PATH = 'C:/Users/mohan/.gemini/antigravity-ide/brain/86c1ca6a-7200-4e6c-bf81-c71e4daf2a84/.user_uploaded/media_1790083272380.jpg';
const LOCAL_PUBLIC_PATH = 'C:/Zobra/apps/web/public/images/products/classic-cotton-cap.jpg';

async function main() {
  console.log('--- Step 1: Copy local asset ---');
  if (fs.existsSync(USER_IMAGE_PATH)) {
    fs.mkdirSync(path.dirname(LOCAL_PUBLIC_PATH), { recursive: true });
    fs.copyFileSync(USER_IMAGE_PATH, LOCAL_PUBLIC_PATH);
    console.log('Copied image to:', LOCAL_PUBLIC_PATH);
  } else {
    console.warn('Source image not found:', USER_IMAGE_PATH);
  }

  console.log('--- Step 2: Upload to Cloudinary ---');
  let cloudinaryUrl = 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790083272/products/classic-cotton-cap.jpg';
  try {
    const uploadRes = await cloudinary.uploader.upload(USER_IMAGE_PATH, {
      folder: 'products',
      public_id: 'classic-cotton-cap-black',
      overwrite: true,
      resource_type: 'image',
    });
    cloudinaryUrl = uploadRes.secure_url;
    console.log('Cloudinary Upload Success:', cloudinaryUrl);
  } catch (err) {
    console.warn('Cloudinary upload error, using fallback or existing URL:', err);
  }

  console.log('--- Step 3: Find or Create Caps & Headwear Category ---');
  let capCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'caps' },
        { name: { contains: 'Cap', mode: 'insensitive' } },
      ],
    },
  });

  if (!capCategory) {
    capCategory = await prisma.category.create({
      data: {
        name: 'Caps & Headwear',
        slug: 'caps',
        description: 'Promotional embroidered cotton caps, snapbacks, and sun visors.',
        image: cloudinaryUrl,
      },
    });
    console.log('Created Category:', capCategory.name);
  } else {
    console.log('Found Category:', capCategory.name, capCategory.id);
  }

  console.log('--- Step 4: Upsert Classic Promotional Cotton Cap in DB ---');
  const capSlug = 'classic-promotional-cotton-cap';
  const capDescription = 'Premium 6-panel structured baseball cap crafted from 100% heavy brushed cotton twill. Features pre-curved visor with 6 rows of stitching, sewn ventilation eyelets, interior moisture-wicking sweatband, and an adjustable brass buckle strap at the back. Engineered specifically for high-definition 3D puff embroidery, woven badges, and heat-transfer corporate branding.';

  // Check if product exists
  const existing = await prisma.product.findUnique({
    where: { slug: capSlug },
  });

  let product;
  const productData = {
    name: 'Classic Promotional Structured Cotton Cap',
    slug: capSlug,
    hsnCode: '6505',
    gstRate: 5.0,
    description: capDescription,
    basePrice: 149.0,
    images: [cloudinaryUrl, '/images/products/classic-cotton-cap.jpg'],
    categoryId: capCategory.id,
    isActive: true,
    requiresColor: true,
    requiresSize: false,
    supportsVariantMatrix: false,
  };

  if (existing) {
    product = await prisma.product.update({
      where: { id: existing.id },
      data: productData,
    });
    console.log('Updated existing cap product:', product.id);
  } else {
    product = await prisma.product.create({
      data: productData,
    });
    console.log('Created new cap product:', product.id);
  }

  // Delete old variants & bulk pricing to ensure fresh clean state
  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.bulkPricing.deleteMany({ where: { productId: product.id } });

  // Add Cap Color Variants (Free Size)
  const capVariants = [
    { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
    { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
    { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
    { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
    { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
  ];

  for (const v of capVariants) {
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
  console.log(`Created ${capVariants.length} color variants.`);

  // Add Bulk Pricing Tiers
  const pricingTiers = [
    { minQuantity: 20, maxQuantity: 49, pricePerUnit: 149.0, printType: 'Front 3D Embroidery' },
    { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129.0, printType: 'Front 3D Embroidery' },
    { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109.0, printType: 'Front 3D Embroidery' },
    { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95.0, printType: 'Front 3D Embroidery' },
    { minQuantity: 500, maxQuantity: 10000, pricePerUnit: 85.0, printType: 'Front 3D Embroidery' },
  ];

  for (const p of pricingTiers) {
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
  console.log(`Created ${pricingTiers.length} bulk pricing tiers.`);

  console.log('CAP PRODUCT ADDED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Error adding cap product:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
