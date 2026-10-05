import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config';
import {
  normalizeProductConfig,
  toPublicProduct,
  toAdminProduct,
  ProductValidationError,
} from '../src/modules/products/product-config';
import {
  getCustomizerTemplateById,
  getTemplateCapabilities,
} from '../src/modules/products/customizer-templates';
import { validateProductCustomizerFeatures } from '../src/modules/quotes/quotes.controller';

import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('Phase 3: Product-Specific Customizer Features', () => {
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { id: 'admin-101', email: 'admin@zobbra.com', role: 'ADMIN' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Get a valid category
    const cat = await prisma.category.findFirst();
    if (cat) {
      testCategoryId = cat.id;
    } else {
      const newCat = await prisma.category.create({
        data: { name: 'Apparel Test', slug: 'apparel-test' },
      });
      testCategoryId = newCat.id;
    }

    // Authenticate or create a customer
    const cust = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    if (cust) {
      customerId = cust.id;
      const custLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: cust.email, password: 'password123' });
      customerToken = custLogin.body.token || adminToken;
    } else {
      const newCust = await prisma.user.create({
        data: {
          email: 'customertest-phase3@zobra.com',
          passwordHash: 'hashedpassword',
          name: 'Customer Phase 3',
          role: 'CUSTOMER',
        },
      });
      customerId = newCust.id;
      customerToken = adminToken;
    }
  });

  // 1-5. Product can enable/disable each feature
  describe('Product Feature Configuration (Unit)', () => {
    it('1. Product can enable/disable trim color', () => {
      const on = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
      });
      expect(on.trimColorEnabled).toBe(true);

      const off = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: false,
      });
      expect(off.trimColorEnabled).toBe(false);
    });

    it('2. Product can enable/disable taping', () => {
      const on = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        tapingColorEnabled: true,
      });
      expect(on.tapingColorEnabled).toBe(true);

      const off = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        tapingColorEnabled: false,
      });
      expect(off.tapingColorEnabled).toBe(false);
    });

    it('3. Product can enable/disable back design', () => {
      const on = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        backDesignEnabled: true,
      });
      expect(on.backDesignEnabled).toBe(true);

      const off = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        backDesignEnabled: false,
      });
      expect(off.backDesignEnabled).toBe(false);
    });

    it('4. Product can enable/disable embroidery', () => {
      const on = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        embroideryEnabled: true,
      });
      expect(on.embroideryEnabled).toBe(true);

      const off = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        embroideryEnabled: false,
      });
      expect(off.embroideryEnabled).toBe(false);
    });

    it('5. Product can enable/disable zipper on compatible templates', () => {
      const on = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'bag-v1',
        zipperEnabled: true,
      });
      expect(on.zipperEnabled).toBe(true);

      const off = normalizeProductConfig({
        customizationEnabled: true,
        customizerTemplateId: 'bag-v1',
        zipperEnabled: false,
      });
      expect(off.zipperEnabled).toBe(false);
    });

    it('6. Template capability limits product options (impossible combinations rejected)', () => {
      // Polo does NOT support zipper -> must reject
      expect(() => {
        normalizeProductConfig({
          customizationEnabled: true,
          customizerTemplateId: 'polo-v1',
          zipperEnabled: true,
        });
      }).toThrow(/does not support zipper option/i);

      // Ceramic Mug does NOT support embroidery -> must reject
      expect(() => {
        normalizeProductConfig({
          customizationEnabled: true,
          customizerTemplateId: 'mug-v1',
          embroideryEnabled: true,
        });
      }).toThrow(/does not support embroidery/i);

      // Ceramic Mug does NOT support taping -> must reject
      expect(() => {
        normalizeProductConfig({
          customizationEnabled: true,
          customizerTemplateId: 'mug-v1',
          tapingColorEnabled: true,
        });
      }).toThrow(/does not support taping color customization/i);
    });
  });

  // 9. Customer receives correct feature configuration
  describe('Customer vs Admin Serialization (Unit)', () => {
    it('customer receives correct customizer feature configuration', () => {
      const product = {
        id: 'p1',
        name: 'Corporate Polo',
        slug: 'corp-polo',
        basePrice: 350,
        customizationEnabled: true,
        designerEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        tapingColorEnabled: false,
        backDesignEnabled: true,
        embroideryEnabled: false,
        zipperEnabled: false,
      };

      const publicProd = toPublicProduct(product);
      expect(publicProd.customizer).toBeDefined();
      expect(publicProd.customizer.enabled).toBe(true);
      expect(publicProd.customizer.trimColor).toBe(true);
      expect(publicProd.customizer.taping).toBe(false);
      expect(publicProd.customizer.back).toBe(true);
      expect(publicProd.customizer.embroidery).toBe(false);
      expect(publicProd.customizer.zipper).toBe(false);
    });

    it('customer customizer is disabled when customizationEnabled is false', () => {
      const product = {
        id: 'p2',
        name: 'Plain Polo',
        slug: 'plain-polo',
        basePrice: 250,
        customizationEnabled: false,
        designerEnabled: false,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        backDesignEnabled: true,
      };

      const publicProd = toPublicProduct(product);
      expect(publicProd.customizer.enabled).toBe(false);
      expect(publicProd.customizer.trimColor).toBe(false);
      expect(publicProd.customizer.back).toBe(false);
    });
  });

  // 10-14. Server-Side Validation: disabled features cannot be submitted
  describe('Server-Side Customization Feature Protection (Unit & Validator)', () => {
    const poloProduct = {
      id: 'polo-test-1',
      name: 'Custom Polo Shirt',
      customizationEnabled: true,
      customizerTemplateId: 'polo-v1',
      trimColorEnabled: false,
      tapingColorEnabled: false,
      backDesignEnabled: false,
      embroideryEnabled: false,
      zipperEnabled: false,
    };

    it('10. Disabled back cannot be submitted', () => {
      const error = validateProductCustomizerFeatures(poloProduct, {
        previewBackUrl: 'https://res.cloudinary.com/zobra/back.png',
      });
      expect(error).toContain("Back design is disabled for 'Custom Polo Shirt'");
    });

    it('11. Disabled trim cannot be submitted', () => {
      const error = validateProductCustomizerFeatures(poloProduct, {
        collarColor: 'Navy Blue',
      });
      expect(error).toContain("Collar & rib color customization is disabled for 'Custom Polo Shirt'");
    });

    it('12. Disabled taping cannot be submitted', () => {
      const error = validateProductCustomizerFeatures(poloProduct, {
        tapingColor: 'Gold',
      });
      expect(error).toContain("Taping color customization is disabled for 'Custom Polo Shirt'");
    });

    it('13. Disabled embroidery cannot be submitted', () => {
      const error = validateProductCustomizerFeatures(poloProduct, {
        embroidery: true,
      });
      expect(error).toContain("Embroidery option is disabled for 'Custom Polo Shirt'");
    });

    it('14. Disabled zipper cannot be submitted', () => {
      const error = validateProductCustomizerFeatures(poloProduct, {
        zipper: true,
      });
      expect(error).toContain("Zipper option is disabled for 'Custom Polo Shirt'");
    });

    it('accepts submission when all requested features are enabled', () => {
      const enabledProduct = {
        id: 'polo-test-2',
        name: 'Full Custom Polo',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        tapingColorEnabled: true,
        backDesignEnabled: true,
        embroideryEnabled: true,
        zipperEnabled: false,
      };

      const error = validateProductCustomizerFeatures(enabledProduct, {
        collarColor: 'Navy Blue',
        tapingColor: 'Gold',
        previewBackUrl: 'https://res.cloudinary.com/zobra/back.png',
        embroidery: true,
      });
      expect(error).toBeNull();
    });

    it('16. Legacy products without a template still work', () => {
      const legacyProduct = {
        id: 'legacy-p1',
        name: 'Legacy T-Shirt',
        customizationEnabled: true,
        customizerTemplateId: null,
      };

      const error = validateProductCustomizerFeatures(legacyProduct, {
        previewBackUrl: 'https://res.cloudinary.com/zobra/back.png',
        collarColor: 'Red',
      });
      expect(error).toBeNull();
    });
  });

  // 7, 8, 15. Admin Save, Persist & Real API Validation
  describe('Admin API Product Feature Persistence & Quote Enforcement', () => {
    let createdProductId: string;

    it('7. Admin saves feature configuration correctly via API', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Phase 3 Feature Polo',
          slug: `phase3-feature-polo-${Date.now()}`,
          basePrice: 399,
          categoryId: testCategoryId,
          customizationEnabled: true,
          customizerTemplateId: 'polo-v1',
          trimColorEnabled: true,
          tapingColorEnabled: false,
          backDesignEnabled: true,
          embroideryEnabled: false,
          zipperEnabled: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const prod = res.body.product;
      createdProductId = prod.id;

      expect(prod.customizerTemplateId).toBe('polo-v1');
      expect(prod.trimColorEnabled).toBe(true);
      expect(prod.tapingColorEnabled).toBe(false);
      expect(prod.backDesignEnabled).toBe(true);
      expect(prod.embroideryEnabled).toBe(false);
      expect(prod.zipperEnabled).toBe(false);
    });

    it('8. Admin edits product and values persist (turn Trim OFF)', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trimColorEnabled: false,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.trimColorEnabled).toBe(false);

      // Verify persistence by fetching product
      const getRes = await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.product.trimColorEnabled).toBe(false);
      expect(getRes.body.product.backDesignEnabled).toBe(true);
    });

    it('11b. Quote rejects collarColor when trimColorEnabled is OFF on product', async () => {
      const quoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: createdProductId,
          customerId,
          quantity: 50,
          color: 'White',
          collarColor: 'Crimson Red',
        });

      expect(quoteRes.status).toBe(400);
      expect(quoteRes.body.success).toBe(false);
      expect(quoteRes.body.message).toContain('Collar & rib color customization is disabled');
    });

    it('Re-enabling Trim allows collarColor submission again', async () => {
      await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trimColorEnabled: true,
        });

      const quoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: createdProductId,
          customerId,
          quantity: 50,
          color: 'White',
          collarColor: 'Crimson Red',
        });

      expect(quoteRes.status).toBe(201);
      expect(quoteRes.body.success).toBe(true);
    });

    it('15. Historical quotes remain intact when product feature configuration changes', async () => {
      // 1. Create a quote with Back design enabled
      const quoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: createdProductId,
          customerId,
          quantity: 50,
          color: 'White',
          previewFrontUrl: 'https://res.cloudinary.com/zobbra/p3-front.png',
          previewBackUrl: 'https://res.cloudinary.com/zobbra/p3-back.png',
        });

      expect(quoteRes.status).toBe(201);
      const quoteId = quoteRes.body.quote.id;
      expect(quoteRes.body.quote.previewBackUrl).toBe('https://res.cloudinary.com/zobbra/p3-back.png');

      // 2. Turn Back design OFF on product
      await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          backDesignEnabled: false,
        });

      // 3. Verify historical quote was NOT modified
      const fetchedQuote = await request(app)
        .get(`/api/v1/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(fetchedQuote.status).toBe(200);
      expect(fetchedQuote.body.quote.previewBackUrl).toBe('https://res.cloudinary.com/zobbra/p3-back.png');
    });
  });
});
