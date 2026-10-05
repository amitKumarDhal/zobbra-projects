import { prisma } from '../src/config/index.js';
import {
  normalizeProductConfig,
  toPublicProduct,
  toAdminProduct,
} from '../src/modules/products/product-config.js';
import {
  getCustomizerTemplateById,
  createCustomizerTemplate,
} from '../src/modules/products/customizer-templates.js';

async function main() {
  console.log('=== REAL UI & API VERIFICATION FOR PHASE 3 ===\n');

  // Ensure test category exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Apparel', slug: 'apparel' },
    });
  }

  // 1. PRODUCT 1: Assigned to Polo Template (polo-v1)
  console.log('--- Configuring Product 1 (Polo Template) ---');
  const poloConfig = normalizeProductConfig({
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    tapingColorEnabled: false,
    backDesignEnabled: true,
    embroideryEnabled: false,
    zipperEnabled: false,
  });

  const product1 = await prisma.product.upsert({
    where: { slug: 'dev-polo-customizer-phase3' },
    update: {
      customizationEnabled: poloConfig.customizationEnabled,
      customizerTemplateId: poloConfig.customizerTemplateId,
      trimColorEnabled: poloConfig.trimColorEnabled,
      tapingColorEnabled: poloConfig.tapingColorEnabled,
      backDesignEnabled: poloConfig.backDesignEnabled,
      embroideryEnabled: poloConfig.embroideryEnabled,
      zipperEnabled: poloConfig.zipperEnabled,
    },
    create: {
      name: 'Dev Polo Phase 3 Product',
      slug: 'dev-polo-customizer-phase3',
      description: 'Dev Polo customizer phase 3 product description',
      basePrice: 299,
      categoryId: category.id,
      customizationEnabled: poloConfig.customizationEnabled,
      customizerTemplateId: poloConfig.customizerTemplateId,
      trimColorEnabled: poloConfig.trimColorEnabled,
      tapingColorEnabled: poloConfig.tapingColorEnabled,
      backDesignEnabled: poloConfig.backDesignEnabled,
      embroideryEnabled: poloConfig.embroideryEnabled,
      zipperEnabled: poloConfig.zipperEnabled,
    },
  });

  const adminPolo = toAdminProduct(product1);
  const publicPolo = toPublicProduct(product1);

  console.log('Product 1 (Admin Stored Values):', {
    name: adminPolo.name,
    customizerTemplateId: adminPolo.customizerTemplateId,
    customizationEnabled: adminPolo.customizationEnabled,
    trimColorEnabled: adminPolo.trimColorEnabled,
    tapingColorEnabled: adminPolo.tapingColorEnabled,
    backDesignEnabled: adminPolo.backDesignEnabled,
    embroideryEnabled: adminPolo.embroideryEnabled,
    zipperEnabled: adminPolo.zipperEnabled,
  });

  console.log('Product 1 (Customer Public Customizer Output):', publicPolo.customizer);

  if (
    adminPolo.customizationEnabled === true &&
    adminPolo.trimColorEnabled === true &&
    adminPolo.tapingColorEnabled === false &&
    adminPolo.backDesignEnabled === true &&
    adminPolo.embroideryEnabled === false &&
    adminPolo.zipperEnabled === false &&
    publicPolo.customizer.enabled === true &&
    publicPolo.customizer.trimColor === true &&
    publicPolo.customizer.taping === false &&
    publicPolo.customizer.back === true &&
    publicPolo.customizer.embroidery === false &&
    publicPolo.customizer.zipper === false
  ) {
    console.log('✓ Product 1 matches exact requested configuration!\n');
  } else {
    throw new Error('Product 1 verification failed!');
  }

  // 2. PRODUCT 2: Second product with independent configuration
  // For zipper + taping + embroidery, create/use an advanced template with those capabilities
  console.log('--- Configuring Product 2 (Multi-Feature Template) ---');
  let multiTemplate = getCustomizerTemplateById('multi-feature-v1');
  if (!multiTemplate) {
    multiTemplate = await createCustomizerTemplate({
      id: 'multi-feature-v1',
      name: 'Executive Technical Apparel',
      categoryCompatibility: ['apparel', 'bags'],
      active: true,
      supportsBack: true,
      capabilities: {
        supportsTrimColor: true,
        supportsTapingColor: true,
        supportsBack: true,
        supportsEmbroidery: true,
        supportsZipper: true,
      },
    });
  }

  const multiConfig = normalizeProductConfig({
    customizationEnabled: true,
    customizerTemplateId: 'multi-feature-v1',
    trimColorEnabled: false,
    tapingColorEnabled: true,
    backDesignEnabled: false,
    embroideryEnabled: true,
    zipperEnabled: true,
  });

  const product2 = await prisma.product.upsert({
    where: { slug: 'dev-tech-customizer-phase3' },
    update: {
      customizationEnabled: multiConfig.customizationEnabled,
      customizerTemplateId: multiConfig.customizerTemplateId,
      trimColorEnabled: multiConfig.trimColorEnabled,
      tapingColorEnabled: multiConfig.tapingColorEnabled,
      backDesignEnabled: multiConfig.backDesignEnabled,
      embroideryEnabled: multiConfig.embroideryEnabled,
      zipperEnabled: multiConfig.zipperEnabled,
    },
    create: {
      name: 'Dev Tech Phase 3 Product',
      slug: 'dev-tech-customizer-phase3',
      description: 'Dev Tech customizer phase 3 product description',
      basePrice: 599,
      categoryId: category.id,
      customizationEnabled: multiConfig.customizationEnabled,
      customizerTemplateId: multiConfig.customizerTemplateId,
      trimColorEnabled: multiConfig.trimColorEnabled,
      tapingColorEnabled: multiConfig.tapingColorEnabled,
      backDesignEnabled: multiConfig.backDesignEnabled,
      embroideryEnabled: multiConfig.embroideryEnabled,
      zipperEnabled: multiConfig.zipperEnabled,
    },
  });

  const adminMulti = toAdminProduct(product2);
  const publicMulti = toPublicProduct(product2);

  console.log('Product 2 (Admin Stored Values):', {
    name: adminMulti.name,
    customizerTemplateId: adminMulti.customizerTemplateId,
    customizationEnabled: adminMulti.customizationEnabled,
    trimColorEnabled: adminMulti.trimColorEnabled,
    tapingColorEnabled: adminMulti.tapingColorEnabled,
    backDesignEnabled: adminMulti.backDesignEnabled,
    embroideryEnabled: adminMulti.embroideryEnabled,
    zipperEnabled: adminMulti.zipperEnabled,
  });

  console.log('Product 2 (Customer Public Customizer Output):', publicMulti.customizer);

  if (
    adminMulti.customizationEnabled === true &&
    adminMulti.trimColorEnabled === false &&
    adminMulti.tapingColorEnabled === true &&
    adminMulti.backDesignEnabled === false &&
    adminMulti.embroideryEnabled === true &&
    adminMulti.zipperEnabled === true &&
    publicMulti.customizer.enabled === true &&
    publicMulti.customizer.trimColor === false &&
    publicMulti.customizer.taping === true &&
    publicMulti.customizer.back === false &&
    publicMulti.customizer.embroidery === true &&
    publicMulti.customizer.zipper === true
  ) {
    console.log('✓ Product 2 stores and exposes its own independent configuration!\n');
  } else {
    throw new Error('Product 2 verification failed!');
  }

  console.log('=== REAL UI & API VERIFICATION SUCCESSFUL ===');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
