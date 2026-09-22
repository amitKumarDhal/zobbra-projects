import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Executive Corporate Laptop Backpack...');

  // Find or create 'Bags & Backpacks' category
  let bagCategory = await prisma.category.findFirst({
    where: { slug: 'bags' }
  });

  if (!bagCategory) {
    bagCategory = await prisma.category.create({
      data: {
        name: 'Bags & Backpacks',
        slug: 'bags',
        description: 'Customized laptop bags, conference totes, and drawstring gym bags.',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      }
    });
  }

  const slug = 'executive-corporate-laptop-backpack';
  
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
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790085384/products/executive-corporate-backpack-black.jpg',
          '/images/products/executive-laptop-backpack.jpg',
        ],
      }
    });
    console.log('Updated product ID:', existing.id);
    return;
  }

  const description = `Executive 28L corporate laptop backpack engineered with high-density water-resistant ballistic polyester, dual reinforced compartments, and a dedicated 15.6" padded laptop sleeve.

### Key Features & Specifications:
- **Material**: 900D Heavy-Duty Water-Repellent Ballistic Polyester with scratch-resistant coating.
- **Laptop Protection**: Dedicated shock-absorbing padded sleeve accommodates up to 15.6-inch laptops and tablets.
- **Capacity & Compartments**: 28-Litre capacity featuring 2 large zippered main compartments, 1 quick-access front zippered organizer, and 1 side elastic mesh water bottle holder.
- **Ergonomics**: Contoured multi-panel airflow back padding with breathable mesh and adjustable padded shoulder straps for maximum lumbar support.
- **Hardware & Finish**: Heavy-duty dual metal zippers with corded pullers, reinforced top padded grab handle, and subtle cyan-blue contrast piping.
- **Branding Methods**: Tailored for High-Density Embroidery, Rubberized 3D Badges, Silk Screen Printing, and HD DTF Transfer on the front corporate branding zone (12cm × 8cm).
- **MOQ**: 20 Pieces. Ideal for new hire welcome kits, corporate gifting, tech conferences, and executive teams.`;

  const newProduct = await prisma.product.create({
    data: {
      name: 'Executive Corporate Laptop Backpack',
      slug,
      hsnCode: '4202',
      gstRate: 18.0,
      description,
      basePrice: 699.0,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790085384/products/executive-corporate-backpack-black.jpg',
        '/images/products/executive-laptop-backpack.jpg',
      ],
      categoryId: bagCategory.id,
      requiresColor: true,
      requiresSize: false,
      isActive: true,
      variants: {
        create: [
          { color: 'Charcoal Black', size: 'Free Size', sku: 'BAG-EXEC-BLK-FS', stock: 500 },
          { color: 'Navy Blue', size: 'Free Size', sku: 'BAG-EXEC-NVY-FS', stock: 350 },
          { color: 'Heather Grey', size: 'Free Size', sku: 'BAG-EXEC-GRY-FS', stock: 250 },
        ],
      },
      bulkPricing: {
        create: [
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 699.0, printType: 'Front Logo Print / Embroidery' },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 649.0, printType: 'Front Logo Print / Embroidery' },
          { minQuantity: 100, maxQuantity: 249, pricePerUnit: 599.0, printType: 'Front Logo Print / Embroidery' },
          { minQuantity: 250, maxQuantity: 499, pricePerUnit: 549.0, printType: 'Front Logo Print / Embroidery' },
          { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 499.0, printType: 'Front Logo Print / Embroidery' },
        ],
      },
    },
  });

  console.log('Successfully created Bag product:', newProduct.name, 'ID:', newProduct.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
