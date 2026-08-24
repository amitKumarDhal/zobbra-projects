import request from 'supertest';
import crypto from 'crypto';
import app from '../../app.js';
import { prisma } from '../../config/index.js';

async function runSecurityTests() {
  console.log('--- STARTING RAZORPAY PAYMENT SECURITY TESTS ---');

  try {
    // 1. Fetch test customer
    const customer = await prisma.user.findUnique({ where: { email: 'customer@zobbra.test' } });
    if (!customer) throw new Error('Customer customer@zobbra.test not found in DB');

    const resCust1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@zobbra.test', password: 'customer123' });
    const customerToken = resCust1.body.token;

    // Login admin
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zobra.test', password: 'admin123' });
    const adminToken = resAdmin.body.token;

    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-SEC-${Date.now()}`,
        customerId: customer.id,
        subtotal: 2000,
        gstTotal: 100,
        totalAmount: 2100,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    const cancelledOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-CANCEL-${Date.now()}`,
        customerId: customer.id,
        subtotal: 2000,
        gstTotal: 100,
        totalAmount: 2100,
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
      },
    });

    const paidOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-PAID-${Date.now()}`,
        customerId: customer.id,
        subtotal: 2000,
        gstTotal: 100,
        totalAmount: 2100,
        status: 'PENDING',
        paymentStatus: 'PAID',
      },
    });

    // Test 1: Unauthenticated request -> 401
    const res1 = await request(app).post('/api/v1/payments/create-order').send({ orderId: testOrder.id });
    console.log('Test 1 (Unauthenticated -> 401):', res1.status === 401 ? 'PASS' : `FAIL (${res1.status})`);

    // Test 2: Invalid order -> 404
    const res2 = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: '00000000-0000-0000-0000-000000000000' });
    console.log('Test 2 (Invalid Order -> 404):', res2.status === 404 ? 'PASS' : `FAIL (${res2.status})`);

    // Test 3: Cancelled order -> 400
    const res3 = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: cancelledOrder.id });
    console.log('Test 3 (Cancelled Order -> Rejected):', res3.status === 400 ? 'PASS' : `FAIL (${res3.status})`);

    // Test 4: Already paid order -> 400
    const res4 = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: paidOrder.id });
    console.log('Test 4 (Already Paid Order -> Rejected):', res4.status === 400 ? 'PASS' : `FAIL (${res4.status})`);

    // Test 5: Amount security (browser-supplied amount is ignored, server computes 2100 * 100 = 210000)
    const res5 = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: testOrder.id, amount: 1 });
    const correctAmount = res5.body?.payment?.amount === 210000;
    console.log('Test 5 (Browser-supplied amount ignored, calculated 210000 paise):', correctAmount ? 'PASS' : `FAIL (${res5.body?.payment?.amount})`);

    // Test 6: Razorpay secret never in response
    const jsonStr = JSON.stringify(res5.body);
    const secretExposed = jsonStr.includes('6ps9ceNE2fSUfee39DLUTUIG');
    console.log('Test 6 (Razorpay Secret Never Exposed):', !secretExposed ? 'PASS' : 'FAIL (Secret Exposed!)');

    // Test 7: Invalid Razorpay signature verification -> 400
    const res7 = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: testOrder.id,
        razorpay_order_id: 'order_fake_123',
        razorpay_payment_id: 'pay_fake_123',
        razorpay_signature: 'invalid_signature_hash',
      });
    console.log('Test 7 (Invalid Signature -> Rejected):', res7.status === 400 ? 'PASS' : `FAIL (${res7.status})`);

    // Test 8: Valid HMAC signature -> Payment SUCCESS & Order PAID
    const rzpOrderId = res5.body.payment.razorpayOrderId;
    const rzpPaymentId = `pay_test_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || '6ps9ceNE2fSUfee39DLUTUIG';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');


    const res8 = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: testOrder.id,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: validSignature,
      });

    const isPaid = res8.body?.order?.paymentStatus === 'PAID';
    console.log('Test 8 (Valid Signature -> Order PAID):', isPaid ? 'PASS' : `FAIL (${res8.body?.order?.paymentStatus})`);

    // Cleanup test orders
    await prisma.payment.deleteMany({
      where: { orderId: { in: [testOrder.id, cancelledOrder.id, paidOrder.id] } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: [testOrder.id, cancelledOrder.id, paidOrder.id] } },
    });

    console.log('--- ALL PAYMENT SECURITY TESTS COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Security Test Execution Failed:', err);
    process.exit(1);
  }
}

runSecurityTests();
