/// <reference types="cypress" />

describe('ZOBBRA ORDER FLOW - NEGATIVE PATHS', () => {
  const customerA = {
    name: 'Customer A',
    email: `customer-a-${Date.now()}@zobbra.test`,
    password: 'Password@123',
    companyName: 'Company A'
  };

  const customerB = {
    name: 'Customer B',
    email: `customer-b-${Date.now()}@zobbra.test`,
    password: 'Password@123',
    companyName: 'Company B'
  };

  let quoteAId: string;
  let orderAId: string;

  before(() => {
    // Register both test customers
    cy.request({ method: 'POST', url: 'http://localhost:5000/api/v1/auth/register', body: customerA, failOnStatusCode: false });
    cy.request({ method: 'POST', url: 'http://localhost:5000/api/v1/auth/register', body: customerB, failOnStatusCode: false });
  });

  it('Phase 6.1: Setup Customer A Quote & Order', () => {
    cy.login(customerA.email, customerA.password);
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      // Create Quote A
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/quotes',
        headers: { Authorization: `Bearer ${token}` },
        body: { items: [{ productId: 'polo-200gsm', quantity: 1, unitPrice: 10 }], totalAmount: 10 }
      }).then((res) => {
        quoteAId = res.body.quote.id;
        
        // Admin approves Quote A for tests
        cy.login('admin@zobra.test', 'admin123');
        cy.window().then((adminWin) => {
          const adminToken = adminWin.localStorage.getItem('token');
          cy.request({
            method: 'PUT',
            url: `http://localhost:5000/api/v1/quotes/${quoteAId}/status`,
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'APPROVED' }
          }).then(() => {
            // Customer A converts to Order A
            cy.request({
              method: 'POST',
              url: `http://localhost:5000/api/v1/orders/from-quote/${quoteAId}`,
              headers: { Authorization: `Bearer ${token}` }
            }).then((orderRes) => {
              orderAId = orderRes.body.order.id;
            });
          });
        });
      });
    });
  });

  it('Phase 6.2: Customer B attempts to access Customer A quote', () => {
    cy.clearLocalStorage();
    cy.login(customerB.email, customerB.password);
    
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: `http://localhost:5000/api/v1/quotes/${quoteAId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(403);
      });
    });
  });

  it('Phase 6.3: Customer B attempts to convert Customer A quote', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'POST',
        url: `http://localhost:5000/api/v1/orders/from-quote/${quoteAId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([403, 409]); // Either forbidden or already converted
      });
    });
  });

  it('Phase 6.4: Customer B attempts to access Customer A order', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: `http://localhost:5000/api/v1/orders/${orderAId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(403);
      });
    });
  });

  it('Phase 6.5: Direct Invalid Status Transition (CONFIRMED -> DELIVERED)', () => {
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123'); // Admin
    
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      // Set to CONFIRMED first
      cy.request({
        method: 'PUT',
        url: `http://localhost:5000/api/v1/orders/${orderAId}/status`,
        headers: { Authorization: `Bearer ${token}` },
        body: { status: 'CONFIRMED' },
        failOnStatusCode: false
      }).then(() => {
        // Attempt jump to DELIVERED
        cy.request({
          method: 'PUT',
          url: `http://localhost:5000/api/v1/orders/${orderAId}/status`,
          headers: { Authorization: `Bearer ${token}` },
          body: { status: 'DELIVERED' },
          failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.include('Invalid order status transition');
      });
      });
    });
  });

  it('Phase 6.6: Invalid Payment Verification Signature', () => {
    cy.clearLocalStorage();
    cy.login(customerA.email, customerA.password);
    
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/payments/verify',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          razorpay_order_id: `rzp_test_invalid_${Date.now()}`,
          razorpay_payment_id: 'pay_invalid',
          razorpay_signature: 'invalid_signature_no_sig_cy_prefix',
          orderId: orderAId
        },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.message).to.include('Invalid payment signature');
      });
    });
  });
});
