import request from 'supertest';
import app from '../src/app.js';

describe('Express REST API Tests (Jest + Supertest)', () => {
  it('GET / - should return Zobra API running status', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: 'Zobra API',
      status: 'running',
    });
  });

  it('GET /api/health - should return healthy status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
    });
  });
});
