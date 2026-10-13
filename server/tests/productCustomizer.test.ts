import { normalizeProductConfig, toPublicProduct, toAdminProduct, ProductValidationError } from '../src/modules/products/product-config';
import { getCustomizerTemplateById, isValidCustomizerTemplate, listCustomizerTemplates } from '../src/modules/products/customizer-templates';

describe('Product-Level Customizer System (Server)', () => {
  describe('Customizer Template Registry', () => {
    it('lists all active reusable customizer templates', () => {
      const templates = listCustomizerTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3); // polo, t-shirt, cap
      const polo = templates.find((t) => t.id === 'polo-v1');
      expect(polo).toBeDefined();
      expect(polo?.name).toBe('Polo T-Shirt');
      expect(polo?.colorGroups.some((g) => g.id === 'BODY')).toBe(true);
      expect(polo?.colorGroups.some((g) => g.id === 'TRIM')).toBe(true);
      expect(polo?.layers.length).toBe(6); // Front base+body+trim, Back base+body+trim
    });

    it('validates template IDs accurately', () => {
      expect(isValidCustomizerTemplate('polo-v1')).toBe(true);
      expect(isValidCustomizerTemplate('tshirt-v1')).toBe(true);
      expect(isValidCustomizerTemplate('cap-v1')).toBe(true);
      expect(isValidCustomizerTemplate('non-existent-template')).toBe(false);
      expect(isValidCustomizerTemplate(null)).toBe(false);
      expect(isValidCustomizerTemplate(undefined)).toBe(false);
    });

    it('retrieves template details by id', () => {
      const template = getCustomizerTemplateById('polo-v1');
      expect(template).not.toBeNull();
      expect(template?.id).toBe('polo-v1');
      expect(template?.supportsBack).toBe(true);
      expect(template?.printAreas.length).toBe(2);
    });
  });

  describe('Product Configuration Validation', () => {
    it('accepts product with customizationEnabled: true and a valid customizerTemplateId', () => {
      const config = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
      });
      expect(config.customizationEnabled).toBe(true);
      expect(config.designerEnabled).toBe(true);
      expect(config.customizerTemplateId).toBe('polo-v1');
    });

    it('rejects product with customizationEnabled: true when no template or legacy views are provided', () => {
      expect(() => {
        normalizeProductConfig({
          customizationEnabled: true,
          customizerTemplateId: '',
        });
      }).toThrow('Select a customizer template before enabling customization.');
    });

    it('accepts legacy product with customizationEnabled: true when customizerViews front image exists', () => {
      const config = normalizeProductConfig({
        customizationEnabled: true,
        images: ['https://example.com/front.png'],
        customizerViews: {
          front: { image: 'https://example.com/front.png', area: { x: 0.2, y: 0.2, w: 0.5, h: 0.5 } },
          back: { enabled: false },
        },
      });
      expect(config.customizationEnabled).toBe(true);
    });

    it('allows customizationEnabled: false without requiring a customizerTemplateId', () => {
      const config = normalizeProductConfig({
        customizationEnabled: false,
      });
      expect(config.customizationEnabled).toBe(false);
      expect(config.designerEnabled).toBe(false);
    });

    it('preserves previously selected customizerTemplateId when customizationEnabled is turned false', () => {
      const config = normalizeProductConfig({
        customizationEnabled: false,
        customizerTemplateId: 'polo-v1',
      });
      expect(config.customizationEnabled).toBe(false);
      expect(config.customizerTemplateId).toBe('polo-v1');
    });
  });

  describe('Serialization to Customer & Admin', () => {
    const rawProduct = {
      id: 'prod-polo-test',
      name: 'Custom Polo',
      slug: 'custom-polo',
      basePrice: 299,
      images: ['https://example.com/gallery-thumbnail.png'],
      customizationEnabled: true,
      designerEnabled: true,
      customizerTemplateId: 'polo-v1',
      colors: [{ name: 'Navy', hex: '#000080' }],
      sizes: ['M', 'L'],
      bulkPricing: [],
      variants: [],
      stockCount: 100,
    };

    it('includes customizerTemplateId and customizerTemplate in toPublicProduct', () => {
      const pub = toPublicProduct(rawProduct);
      expect(pub.customizerTemplateId).toBe('polo-v1');
      expect(pub.customizerTemplate).toBeDefined();
      expect(pub.customizerTemplate.id).toBe('polo-v1');
      expect(pub.customizable).toBe(true);
    });

    it('marks customizable: false in toPublicProduct when customizationEnabled is false', () => {
      const nonCustom = {
        ...rawProduct,
        customizationEnabled: false,
        designerEnabled: false,
      };
      const pub = toPublicProduct(nonCustom);
      expect(pub.customizable).toBe(false);
      expect(pub.customizerTemplateId).toBe('polo-v1'); // Retained in data
    });

    it('includes customizerTemplateId in toAdminProduct', () => {
      const admin = toAdminProduct(rawProduct);
      expect(admin.customizerTemplateId).toBe('polo-v1');
      expect(admin.customizerTemplate).toBeDefined();
    });
  });

  describe('Server-Side Quote Customization Protection (Requirement 8 & 9)', () => {
    let customerToken: string;
    let customDisabledProductId: string;
    let customEnabledProductId: string;
    const testIds: string[] = [];

    beforeAll(async () => {
      const { prisma } = await import('../src/config/index.js');
      const { config } = await import('../src/config/index.js');
      const jwt = (await import('jsonwebtoken')).default;

      customerToken = jwt.sign(
        { id: 'cust-phase1-test', email: 'cust-phase1@zobra.test', role: 'CUSTOMER', companyId: null },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      await prisma.user.upsert({
        where: { id: 'cust-phase1-test' },
        update: {},
        create: {
          id: 'cust-phase1-test',
          email: 'cust-phase1@zobra.test',
          name: 'Phase 1 Customer',
          role: 'CUSTOMER',
        },
      });

      const cat = await prisma.category.upsert({
        where: { slug: 'apparel' },
        update: {},
        create: { name: 'Apparel', slug: 'apparel' },
      });

      const disabledProd = await prisma.product.create({
        data: {
          name: 'Non-Customizable Polo',
          slug: 'non-custom-polo-' + Date.now(),
          description: 'Non-customizable test polo',
          basePrice: 299,
          categoryId: cat.id,
          customizationEnabled: false,
          customizerTemplateId: 'polo-v1', // Template retained in storage
          isActive: true,
        },
      });
      customDisabledProductId = disabledProd.id;
      testIds.push(disabledProd.id);

      const enabledProd = await prisma.product.create({
        data: {
          name: 'Customizable Polo',
          slug: 'custom-polo-' + Date.now(),
          description: 'Customizable test polo',
          basePrice: 299,
          categoryId: cat.id,
          customizationEnabled: true,
          customizerTemplateId: 'polo-v1',
          isActive: true,
        },
      });
      customEnabledProductId = enabledProd.id;
      testIds.push(enabledProd.id);
    });

    afterAll(async () => {
      const { prisma } = await import('../src/config/index.js');
      await prisma.quote.deleteMany({ where: { customerId: 'cust-phase1-test' } });
      await prisma.product.deleteMany({ where: { id: { in: testIds } } });
      await prisma.user.deleteMany({ where: { id: 'cust-phase1-test' } });
    });

    it('rejects quote with customizer data when product has customizationEnabled: false', async () => {
      const request = (await import('supertest')).default;
      const app = (await import('../src/app.js')).default;

      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: customDisabledProductId,
          quantity: 50,
          previewFrontUrl: 'https://res.cloudinary.com/demo/image/upload/front.png',
          previewBackUrl: 'https://res.cloudinary.com/demo/image/upload/back.png',
          canvasStateJson: '{"objects":[]}',
          customizationRequirements: '{"printPosition":"Front Only"}',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Customization is not enabled');
    }, 15000);

    it('accepts quote with customizer data when product has customizationEnabled: true', async () => {
      const request = (await import('supertest')).default;
      const app = (await import('../src/app.js')).default;

      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: customEnabledProductId,
          quantity: 50,
          previewFrontUrl: 'https://res.cloudinary.com/demo/image/upload/front.png',
          previewBackUrl: 'https://res.cloudinary.com/demo/image/upload/back.png',
          canvasStateJson: '{"objects":[]}',
          customizationRequirements: '{"printPosition":"Front Only"}',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.quote).toBeDefined();
    });
  });
});
