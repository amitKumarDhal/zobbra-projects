import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZOBBRA B2B SaaS Database with realistic Indian merchandise data...');

  // Clean existing data
  await prisma.systemSetting.deleteMany();
  await prisma.cMSContent.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.productionJob.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.bulkPricing.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Companies
  const demoCompany = await prisma.company.create({
    data: {
      name: 'ZOBBRA Demo Technologies Pvt Ltd',
      gstin: '21AAACA1234A1Z5',
      address: 'Plot 402, Fortune Tower, District Center',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751012',
      notes: 'Primary development test client company',
    },
  });

  const acmeCompany = await prisma.company.create({
    data: {
      name: 'Acme Technologies Pvt Ltd',
      gstin: '21ABCDE1234F1Z5',
      address: 'Plot 105, Infocity Tech Park',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751024',
      notes: 'Key enterprise corporate client. Annual merch order size ~5000 pcs.',
    },
  });

  const zeptoCompany = await prisma.company.create({
    data: {
      name: 'Zepto Logistics India Pvt Ltd',
      gstin: '27AAACZ9999C1Z9',
      address: 'Hiranandani Gardens, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400076',
      notes: 'Delivery fleet merchandise orders (caps, polo t-shirts).',
    },
  });

  // 2. Create Users (Roles: ADMIN, SALES, PRODUCTION, CUSTOMER)
  const testDevAdmin = await prisma.user.create({
    data: {
      email: 'admin@zobra.test',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      phone: '+91 91244 96665',
      role: 'ADMIN',
    },
  });

  const testDevCustomer = await prisma.user.create({
    data: {
      email: 'customer@zobbra.test',
      passwordHash: customerPasswordHash,
      name: 'Rahul Sharma',
      phone: '+919876543210',
      role: 'CUSTOMER',
      companyId: demoCompany.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@zobbra.com',
      passwordHash,
      name: 'Rajesh Sharma (Admin)',
      phone: '+91 98765 43210',
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@zobra.com',
      passwordHash,
      name: 'Priya Das (Sales Lead)',
      phone: '+91 91234 56789',
      role: 'SALES',
    },
  });

  const productionUser = await prisma.user.create({
    data: {
      email: 'production@zobra.com',
      passwordHash,
      name: 'Amitav Mohanty (Print Manager)',
      phone: '+91 94370 12345',
      role: 'PRODUCTION',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'client@acme.com',
      passwordHash,
      name: 'Rahul Mishra (HR Manager)',
      phone: '+91 99370 98765',
      role: 'CUSTOMER',
      companyId: acmeCompany.id,
    },
  });

  // 3. Create Categories
  const catTshirts = await prisma.category.create({
    data: {
      name: 'T-Shirts & Apparel',
      slug: 't-shirts',
      description: 'Premium Customized Polo, Round Neck & V-Neck T-Shirts for Corporate & Events.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catHoodies = await prisma.category.create({
    data: {
      name: 'Hoodies & Sweatshirts',
      slug: 'hoodies',
      description: 'Warm, cozy fleece hoodies with embroidery or DTF logo printing.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catCaps = await prisma.category.create({
    data: {
      name: 'Caps & Headwear',
      slug: 'caps',
      description: 'Promotional embroidered cotton caps, snapbacks, and sun visors.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catBags = await prisma.category.create({
    data: {
      name: 'Bags & Backpacks',
      slug: 'bags',
      description: 'Customized laptop bags, conference totes, and drawstring gym bags.',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catDrinkware = await prisma.category.create({
    data: {
      name: 'Mugs & Bottles',
      slug: 'drinkware',
      description: 'Stainless steel thermal bottles, ceramic coffee mugs, and sippers.',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    },
  });

  // 4. Create Products & Bulk Pricing Matrices
  const poloProduct = await prisma.product.create({
    data: {
      name: 'Premium Polo T-Shirt',
      slug: 'polo-200gsm',
      hsnCode: '6105',
      gstRate: 5.0,
      description: 'Premium quality polo t-shirt made from 100% pure cotton (200 GSM) for a comfortable fit and long-lasting wear. Bio-washed fabric with double stitching.',
      basePrice: 249.0,
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: catTshirts.id,
      variants: {
        create: [
          { color: 'Charcoal Black', size: 'M', sku: 'ZOB-POLO-200-BLK-M', stock: 500 },
          { color: 'Charcoal Black', size: 'XL', sku: 'ZOB-POLO-200-BLK-XL', stock: 750 },
          { color: 'Navy Blue', size: 'L', sku: 'ZOB-POLO-200-NAV-L', stock: 600 },
          { color: 'White', size: 'XL', sku: 'ZOB-POLO-200-WHT-XL', stock: 400 },
        ],
      },
      bulkPricing: {
        create: [
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 249.0, printType: 'Front Only' },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 239.0, printType: 'Front Only' },
          { minQuantity: 100, maxQuantity: 199, pricePerUnit: 229.0, printType: 'Front Only' },
          { minQuantity: 200, maxQuantity: 9999, pricePerUnit: 219.0, printType: 'Front Only' },
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 279.0, printType: 'Back Only' },
          { minQuantity: 20, maxQuantity: 49, pricePerUnit: 349.0, printType: 'Both Sides' },
        ],
      },
    },
  });

  const teeProduct = await prisma.product.create({
    data: {
      name: 'Corporate Cotton T-Shirt',
      slug: 'tee-180gsm',
      hsnCode: '6109',
      gstRate: 5.0,
      description: 'Super-soft 180 GSM bio-washed 100% cotton round neck t-shirt for daily corporate wear and event merchandise.',
      basePrice: 199.0,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: catTshirts.id,
      variants: {
        create: [
          { color: 'Black', size: 'M', sku: 'ZOB-TEE-180-BLK-M', stock: 500 },
          { color: 'White', size: 'L', sku: 'ZOB-TEE-180-WHT-L', stock: 600 },
        ],
      },
    },
  });

  const bagProduct = await prisma.product.create({
    data: {
      name: 'Executive Backpack',
      slug: 'bag-executive',
      hsnCode: '4202',
      gstRate: 18.0,
      description: 'Durable water-resistant executive laptop backpack with padded compartment and brand logo embossing.',
      basePrice: 699.0,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: catBags.id,
      variants: {
        create: [
          { color: 'Black', size: 'Standard', sku: 'ZOB-BAG-001-BLK', stock: 300 },
        ],
      },
    },
  });

  const capProduct = await prisma.product.create({
    data: {
      name: 'Promotional Cotton Cap with Embroidery',
      slug: 'promotional-cotton-cap',
      hsnCode: '6505',
      gstRate: 5.0,
      description: 'Heavy brushed cotton cap with adjustable metal buckle. High precision 3D embroidery branding on front.',
      basePrice: 99.0,
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: catCaps.id,
      bulkPricing: {
        create: [
          { minQuantity: 50, maxQuantity: 199, pricePerUnit: 99.0, printType: 'Embroidery' },
          { minQuantity: 200, maxQuantity: 9999, pricePerUnit: 85.0, printType: 'Embroidery' },
        ],
      },
    },
  });

  // 5. Create Sample Quotes
  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'ZQB-QT-2026-1001',
      customerId: customerUser.id,
      companyId: acmeCompany.id,
      status: 'APPROVED',
      subtotal: 24900.0,
      gstTotal: 1245.0, // 5% GST
      discount: 1000.0,
      totalAmount: 25145.0,
      notes: 'Urgent delivery for Annual Tech Summit event. Need 100 Black Polo T-Shirts.',
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: poloProduct.id,
            printType: 'Both Sides',
            color: 'Black',
            size: 'L',
            quantity: 100,
            unitPrice: 249.0,
            totalPrice: 24900.0,
          },
        ],
      },
    },
  });

  // 6. Create Order from Approved Quote
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ZQB-ORD-2026-5001',
      quoteId: quote1.id,
      customerId: customerUser.id,
      companyId: acmeCompany.id,
      status: 'IN_PRODUCTION',
      paymentStatus: 'PAID',
      subtotal: 24900.0,
      gstTotal: 1245.0,
      totalAmount: 25145.0,
      items: {
        create: [
          {
            productId: poloProduct.id,
            printType: 'Both Sides',
            color: 'Black',
            size: 'L',
            quantity: 100,
            unitPrice: 249.0,
            totalPrice: 24900.0,
            customizationDetails: 'DTF Front Logo (3x3 inch) + Back Text "Acme Tech Team"',
          },
        ],
      },
      production: {
        create: {
          stage: 'PRINTING',
          assignedToId: productionUser.id,
          notes: 'Batch 1 DTF heat press printing in progress.',
          startedAt: new Date(),
        },
      },
      invoices: {
        create: {
          invoiceNumber: 'INV-2026-8001',
          companyId: acmeCompany.id,
          amount: 24900.0,
          gstAmount: 1245.0,
          totalAmount: 25145.0,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'PAID',
        },
      },
    },
  });

  // 7. Seed CMS Contents (Testimonials, FAQs, Blogs)
  await prisma.cMSContent.createMany({
    data: [
      {
        type: 'TESTIMONIAL',
        title: 'Outstanding Quality & Speedy Turnaround!',
        content: 'Zobra Prints delivered 500 customized polo t-shirts and hoodies for our annual conference within 5 working days. High-quality DTF printing and neat embroidery.',
        author: 'Rahul Mishra, HR Manager @ Acme Tech',
      },
      {
        type: 'TESTIMONIAL',
        title: 'Best Bulk Pricing for Corporate Merch in Odisha',
        content: 'The quotation generator made it super easy to compare pricing tiers and get GST invoices instantly. Highly recommended for corporate gifting.',
        author: 'Sunita Swain, Event Lead @ Decathlon',
      },
      {
        type: 'FAQ',
        title: 'What is the minimum order quantity (MOQ) for custom printing?',
        content: 'Our standard MOQ for customized Polo T-Shirts is 20 pieces, while caps and mugs have an MOQ of 50 pieces.',
      },
      {
        type: 'FAQ',
        title: 'Which printing techniques do you offer?',
        content: 'We offer DTF Printing (Direct to Film), Screen Printing, Computerized 3D Embroidery, and Sublimation Printing for sports jerseys.',
      },
      {
        type: 'BLOG',
        title: 'Complete Guide to Corporate Swag & Merch Branding in 2026',
        slug: 'complete-guide-corporate-swag-2026',
        content: 'Corporate gifting has evolved beyond generic pens. Discover how custom bio-washed polo t-shirts and thermal drinkware build brand loyalty.',
        author: 'Zobra Editorial Team',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      },
    ],
  });

  // 8. Seed System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'COMPANY_NAME', value: JSON.stringify('Zobra Prints & Merchandise') },
      { key: 'GSTIN', value: JSON.stringify('21ABCDE1234F1Z5') },
      { key: 'DEFAULT_GST_RATE', value: JSON.stringify(5.0) },
      { key: 'CURRENCY_SYMBOL', value: JSON.stringify('₹') },
    ],
  });

  console.log('✅ Zobra Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
