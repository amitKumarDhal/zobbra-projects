import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';
import { normalizePhoneForWhatsApp, buildWhatsAppClickUrl, generateWhatsAppMessage } from '../src/utils/whatsappTemplates.js';

describe('Sales Conversation & WhatsApp Click-to-Chat Integration', () => {
  const adminToken = jwt.sign(
    { id: 'admin-101', email: 'admin@zobbra.com', role: 'ADMIN', name: 'ZOBBRA Admin' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    { id: 'cust-101', email: 'customer@acme.com', role: 'CUSTOMER', companyId: 'comp-101' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  describe('Phone Normalization & WhatsApp Link Generator', () => {
    it('normalizes 10-digit Indian phone number with 91 prefix', () => {
      expect(normalizePhoneForWhatsApp('9876543210')).toBe('919876543210');
      expect(normalizePhoneForWhatsApp('+91 98765 43210')).toBe('919876543210');
      expect(normalizePhoneForWhatsApp('09876543210')).toBe('919876543210');
    });

    it('generates valid WhatsApp click-to-chat URL with encoded text', () => {
      const text = generateWhatsAppMessage('NEW_QUOTE', {
        customerName: 'Rahul Mishra',
        quoteNumber: 'ZQB-QT-2026-1003',
        productName: 'Polo T-Shirt',
        quantity: 100,
      });

      const url = buildWhatsAppClickUrl('9876543210', text);
      expect(url).toContain('https://wa.me/919876543210?text=');
      expect(url).toContain('Rahul%20Mishra');
    });
  });

  describe('WhatsApp Action & Activity Timeline API', () => {
    it('POST /api/v1/quotes/:id/whatsapp - records WHATSAPP activity and returns click URL', async () => {
      // 1. Create a quote
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createRes.body.quote.id;

      // 2. Trigger WhatsApp click action
      const waRes = await request(app)
        .post(`/api/v1/quotes/${quoteId}/whatsapp`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ template: 'NEW_QUOTE' });

      expect(waRes.status).toBe(200);
      expect(waRes.body.success).toBe(true);
      expect(waRes.body.whatsappUrl).toContain('wa.me');
      expect(waRes.body.activity).toBeDefined();
      expect(waRes.body.activity.type).toBe('WHATSAPP');
    });

    it('POST /api/v1/quotes/:id/activity - creates internal sales note', async () => {
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createRes.body.quote.id;

      const noteRes = await request(app)
        .post(`/api/v1/quotes/${quoteId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'NOTE', message: 'Customer requested 150 units with custom logo' });

      expect(noteRes.status).toBe(201);
      expect(noteRes.body.success).toBe(true);
      expect(noteRes.body.activity.message).toContain('150 units');
    });

    it('PUT /api/v1/quotes/:id - updates quantity and recalculates server pricing', async () => {
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createRes.body.quote.id;

      const editRes = await request(app)
        .put(`/api/v1/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 200, printType: 'Front & Back Print' });

      expect(editRes.status).toBe(200);
      expect(editRes.body.success).toBe(true);
      expect(editRes.body.quote.subtotal).toBeGreaterThan(0);
      expect(editRes.body.quote.activities.some((a: any) => a.type === 'PRICE_UPDATE')).toBe(true);
    });

    it('POST /api/v1/quotes/:id/activity - blocks CUSTOMER role from adding internal sales notes', async () => {
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createRes.body.quote.id;

      const res = await request(app)
        .post(`/api/v1/quotes/${quoteId}/activity`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Illegal customer note' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
