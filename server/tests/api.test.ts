import request from 'supertest';
import app from '../src/app.js';

describe('ZOBBRA B2B SaaS API Integration Tests', () => {
  it('GET /health - should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ZOBBRA B2B SaaS API');
  });

  it('GET /api/v1/products - should return products list', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('POST /api/v1/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid@zobra.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Testimonials Module Tests
  describe('Testimonials Module API', () => {
    let testTestimonialId: string;
    
    it('GET /api/v1/testimonials - should return empty list or testimonials', async () => {
      const res = await request(app).get('/api/v1/testimonials');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/testimonials/stats - should return stats object (unauthorized without token)', async () => {
      const res = await request(app).get('/api/v1/testimonials/stats');
      expect(res.status).toBe(401); // protected route
    });
  });

  describe('Settings Module API', () => {
    it('GET /api/v1/settings/info - should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/settings/info');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/settings/health - should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/settings/health');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/settings - should return 401 without token', async () => {
      const res = await request(app).post('/api/v1/settings').send({ key: 'test', value: 'test' });
      expect(res.status).toBe(401);
    });
  });
});
