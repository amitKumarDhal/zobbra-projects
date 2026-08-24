import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

const prisma = new PrismaClient();
let token: string;
let inquiryId: string;
let customerId: string;

beforeAll(async () => {
  // Setup a test admin user and create valid token
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin_inquiry@test.com' },
    update: {},
    create: {
      email: 'admin_inquiry@test.com',
      passwordHash: '$2a$10$e8w6W2Q1234567890123456789012345678901234567890123456',
      name: 'Admin Test',
      role: 'ADMIN'
    }
  });

  // Setup a test customer
  const cust = await prisma.user.upsert({
    where: { email: 'customer_inq@test.com' },
    update: {},
    create: {
      email: 'customer_inq@test.com',
      passwordHash: '$2a$10$e8w6W2Q1234567890123456789012345678901234567890123456',
      name: 'Customer Test',
      role: 'CUSTOMER'
    }
  });
  customerId = cust.id;

  token = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Inquiry Module API', () => {
  it('should create a new inquiry', async () => {
    const res = await request(app)
      .post('/api/v1/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        productInterest: 'Test Product',
        quantity: 100,
        message: 'Need this asap'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.inquiryNumber).toBeDefined();
    expect(res.body.status).toBe('NEW');
    inquiryId = res.body.id;
  });

  it('should get inquiries list', async () => {
    const res = await request(app)
      .get('/api/v1/inquiries')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it('should update inquiry status', async () => {
    const res = await request(app)
      .patch(`/api/v1/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTED' });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONTACTED');
  });

  it('should add an activity note', async () => {
    const res = await request(app)
      .post(`/api/v1/inquiries/${inquiryId}/activity`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'NOTE', message: 'Called the customer' });
    
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Called the customer');
  });

  it('should convert inquiry to quote', async () => {
    const res = await request(app)
      .post(`/api/v1/inquiries/${inquiryId}/convert-to-quote`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(201);
    expect(res.body.quote).toHaveProperty('id');
    expect(res.body.inquiry.status).toBe('CONVERTED');
  });
  
  it('should fail to convert an already converted inquiry', async () => {
    const res = await request(app)
      .post(`/api/v1/inquiries/${inquiryId}/convert-to-quote`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(400); // Bad request because it's already converted
  });
});
