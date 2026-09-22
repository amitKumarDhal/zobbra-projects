import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Classic Corporate Ceramic Coffee Mug...');

  // Find or create 'Mugs & Bottles' category (slug: drinkware)
  let mugCategory = await prisma.category.findFirst({
    where: { slug: 'drinkware' }
  });

  if (!mugCategory) {
    mugCategory = await prisma.category.create({
      data: {
        name: 'Mugs & Bottles',
        slug: 'drinkware',
        description: 'Stainless steel thermal bottles, ceramic coffee mugs, and sippers.',
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
      }
    });
  }

  const slug = 'classic-corporate-ceramic-mug';
  
  // Check if product already exists
  const existing = await prisma.product.findUnique({
    where: { slug }
  });

  if (existing) {
    console.log('Product already exists, updating active status & images...');
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        images: [
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790086438/products/corporate-ceramic-coffee-mug-black.jpg',
          '/images/products/corporate-ceramic-mug.jpg',
        ],
      }
    });
    console.log('Updated product ID:', existing.id);
    return;
  }

  const description = `Premium 330ml (11oz) matte-finish ceramic coffee mug engineered for corporate gifting, welcome kits, and daily office use.

### Key Features & Specifications:
- **Material**: Premium Grade-A Ceramic Stoneware with chip-resistant rim and durable glaze.
- **Capacity**: 330 ml / 11 oz. Ergonomic C-shaped comfort handle.
- **Finish**: Modern ultra-smooth matte exterior with food-grade non-porous interior.
- **Safety Standards**: 100% Lead-Free, Cadmium-Free, Microwave Safe & Dishwasher Safe.
- **Branding Methods**: High-precision Screen Printing, UV DTF Wrap, Sublimation Printing, and Metallic Gold/Silver Foil stamping on dual-sided branding areas (7cm × 7cm per side or full wrap 20cm × 8cm).
- **Packaging**: Individually packed in protective thermocol bubble-wrap and corrugated Kraft gift box.
- **MOQ**: 25 Pieces. Ideal for employee onboarding kits, client appreciation, executive desk accessories, and corporate events.`;

  const newProduct = await prisma.product.create({
    data: {
      name: 'Classic Corporate Ceramic Coffee Mug',
      slug,
      hsnCode: '6912',
      gstRate: 12.0,
      description,
      basePrice: 149.0,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790086438/products/corporate-ceramic-coffee-mug-black.jpg',
        '/images/products/corporate-ceramic-mug.jpg',
      ],
      categoryId: mugCategory.id,
      requiresColor: true,
      requiresSize: false,
      isActive: true,
      variants: {
        create: [
          { color: 'Matte Black', size: 'Free Size', sku: 'MUG-MATTE-BLK-FS', stock: 1000 },
          { color: 'Classic White', size: 'Free Size', sku: 'MUG-GLOSS-WHT-FS', stock: 800 },
          { color: 'Navy Blue', size: 'Free Size', sku: 'MUG-MATTE-NVY-FS', stock: 500 },
        ],
      },
      bulkPricing: {
        create: [
          { minQuantity: 25, maxQuantity: 49, pricePerUnit: 149.0, printType: 'Front & Back Logo Print' },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129.0, printType: 'Front & Back Logo Print' },
          { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109.0, printType: 'Front & Back Logo Print' },
          { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95.0, printType: 'Front & Back Logo Print' },
          { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 79.0, printType: 'Front & Back Logo Print' },
        ],
      },
    },
  });

  console.log('Successfully created Cup / Mug product:', newProduct.name, 'ID:', newProduct.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
