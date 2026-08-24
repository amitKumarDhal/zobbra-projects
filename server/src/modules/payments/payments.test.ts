import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/index.js';


describe('Payment Module API & Security Tests (Razorpay Test Mode)', () => {
  let customerToken: string;
  let customer2Token: string;
  let adminToken: string;
  let testOrderId: string;
  let cancelledOrderId: string;
  let paidOrderId: string;

  beforeAll(async () => {
    // 1. Fetch test customer
    const customer = await prisma.user.findUnique({ where: { email: 'customer@zobbra.test' } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin@zobra.test' } });

    // Login customer 1
    const resCust1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@zobbra.test', password: 'customer123' });
    customerToken = resCust1.body.token;

    // Login admin
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zobra.test', password: 'admin123' });
    adminToken = resAdmin.body.token;

    // Create a dummy user 2 for unauthorized ownership tests
    let user2 = await prisma.user.findUnique({ where: { email: 'customer2@zobra.test' } });
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email: 'customer2@zobra.test',
          name: 'Customer Two',
          passwordHash: '$2a$10$e8w6W2Q1234567890123456789012345678901234567890123456',
          role: 'CUSTOMER',

        },
      });
    }

    const resCust2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@zobra.test', password: 'customer123' });
    customer2Token = resCust2.body.token || customerToken;

    // Create test orders in DB
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}-1`,
        customerId: customer!.id,
        subtotal: 1000,
        gstTotal: 50,
        totalAmount: 1050,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });
    testOrderId = order1.id;

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}-2`,
        customerId: customer!.id,
        subtotal: 1000,
        gstTotal: 50,
        totalAmount: 1050,
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
      },
    });
    cancelledOrderId = order2.id;

    const order3 = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}-3`,
        customerId: customer!.id,
        subtotal: 1000,
        gstTotal: 50,
        totalAmount: 1050,
        status: 'PENDING',
        paymentStatus: 'PAID',
      },
    });
    paidOrderId = order3.id;
  });

  afterAll(async () => {
    // Cleanup created test orders
    await prisma.payment.deleteMany({
      where: { orderId: { in: [testOrderId, cancelledOrderId, paidOrderId] } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: [testOrderId, cancelledOrderId, paidOrderId] } },
    });
    await prisma.user.deleteMany({
      where: { email: 'customer2@zobra.test' },
    });
  });

  it('1. Unauthenticated payment request returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .send({ orderId: testOrderId });

    expect(res.status).toBe(401);
  });

  it('2. Customer paying another customer order returns 403', async () => {
    // Create an order owned by admin or user2
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@zobra.test' } });
    const otherOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-OTHER-${Date.now()}`,
        customerId: adminUser!.id,
        subtotal: 500,
        gstTotal: 25,
        totalAmount: 525,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: otherOrder.id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    await prisma.order.delete({ where: { id: otherOrder.id } });
  });

  it('3. Invalid order ID returns 404', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('4. Cancelled order payment request is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: cancelledOrderId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cancelled');
  });

  it('5. Already paid order payment request is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: paidOrderId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already fully paid');
  });

  it('6. Server calculates amount from DB and ignores browser-supplied amount', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: testOrderId, amount: 1 }); // Attempting to pay ₹1

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Amount in paise must equal order.totalAmount * 100 (1050 * 100 = 105000)
    expect(res.body.payment.amount).toBe(105000);
  });

  it('7. Razorpay secret NEVER appears in response', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: testOrderId });

    expect(res.status).toBe(200);
    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain('zobraTestSecret998877665544332211');
    expect(res.body.payment.keyId).toBeDefined();
    expect(res.body.payment.razorpayKeySecret).toBeUndefined();
  });

  it('8. Invalid Razorpay signature verification is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: testOrderId,
        razorpay_order_id: 'order_fake_123',
        razorpay_payment_id: 'pay_fake_123',
        razorpay_signature: 'invalid_signature_hash',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('9. Valid Razorpay HMAC signature updates order to PAID', async () => {
    // 1. Create order
    const createRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: testOrderId });

    const rzpOrderId = createRes.body.payment.razorpayOrderId;
    const rzpPaymentId = `pay_test_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'zobraTestSecret998877665544332211';

    // Compute valid HMAC SHA256 signature
    const crypto = await import('crypto');
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    // Verify payment
    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: testOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: validSignature,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.order.paymentStatus).toBe('PAID');

    // Confirm in PostgreSQL
    const updatedOrder = await prisma.order.findUnique({ where: { id: testOrderId } });
    expect(updatedOrder?.paymentStatus).toBe('PAID');
  });
});
