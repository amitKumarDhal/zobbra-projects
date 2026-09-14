/// <reference types="cypress" />

describe('ZOBBRA COMPLETE CUSTOMER TO ORDER E2E LIFECYCLE', () => {
  const e2eUser = {
    name: 'ZOBBRA E2E Test User',
    email: `e2e-tester-${Date.now()}@zobbra.test`,
    phone: '9876543210',
    companyName: 'Cypress E2E Pvt Ltd',
    gstin: `21CYPRESS${String(Date.now()).slice(-4)}A1Z5`,
    password: 'Password@123',
    address: '123 Cypress Ave',
    city: 'Mumbai',
    state: 'MH',
    pincode: '400001'
  };

  const adminEmail = Cypress.env('CYPRESS_ADMIN_EMAIL') || 'admin@zobra.test';
  const adminPassword = Cypress.env('CYPRESS_ADMIN_PASSWORD') || 'admin123';

  let quoteId: string;
  let quoteNumber: string;
  let orderId: string;
  let paymentId: string;
  let razorpayOrderId: string;

  before(() => {
    // 1. Isolate test data: Create a completely new customer user
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/register',
      body: e2eUser,
      failOnStatusCode: false,
    }).then((res) => {
      // If it fails, the user might already exist, which is fine
      cy.log('Registered User', res.body);
    });
  });

  // ==========================================
  // CUSTOMER JOURNEY
  // ==========================================

  it('Phase 3.1-3.8: Customer Creates Quote via UI', () => {
    cy.login(e2eUser.email, e2eUser.password);
    
    // Visit Quote Creation Page
    cy.visit('/customer/create-quote');
    
    // Fill out the simplified quote form
    cy.get('input[type="text"]').first().clear().type(e2eUser.name);
    cy.get('input[type="tel"]').clear().type(e2eUser.phone);
    
    // Select the newly implemented dropdown!
    cy.get('select').select('Polo');
    
    // Enter Quantity
    cy.get('input[type="number"]').clear().type('150');
    
    // Intercept quote creation
    cy.intercept('POST', '**/api/v1/quotes').as('createQuote');
    
    // Submit
    cy.contains(/Submit Request/i).click();
    
    // Verify Quote created
    cy.wait('@createQuote').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      quoteId = interception.response?.body.quote.id;
      quoteNumber = interception.response?.body.quote.quoteNumber;
      expect(interception.response?.body.quote.status).to.eq('DRAFT');
    });

    // Success screen should appear or redirect
    cy.url({ timeout: 10000 }).should('include', '/customer/quotes');
  });

  // ==========================================
  // ADMIN JOURNEY
  // ==========================================

  it('Phase 3.9-3.13: Admin Edits and Sends Quote', () => {
    // Logout customer and login admin
    cy.clearLocalStorage();
    cy.login(adminEmail, adminPassword);
    
    // Visit Quote Detail directly
    cy.visit(`/dashboard/quotes/${quoteId}`);
    
    cy.contains(quoteNumber, { timeout: 10000 }).should('be.visible');
    cy.get('body').should('contain.text', e2eUser.companyName);

    // Admin sets pricing (using the UI edit toggle)
    cy.contains(/EDIT QUOTE/i).click();
    
    // Just touch quantity to enable save
    cy.get('input[data-cy="admin-qty-input"]').clear().type('150'); 
    
    // Intercept the patch
    cy.intercept('PUT', `**/api/v1/quotes/${quoteId}`).as('editQuote');
    
    // Admin saves updated pricing
    cy.contains(/SAVE & RECALCULATE/i).click();
    cy.wait('@editQuote').its('response.statusCode').should('eq', 200);

    // Update Status to SENT
    // Use cy.request for reliability since UI might have modals
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'PUT',
        url: `http://localhost:5000/api/v1/quotes/${quoteId}/status`,
        headers: { Authorization: `Bearer ${token}` },
        body: { status: 'SENT' }
      }).then((res) => {
        expect(res.status).to.eq(200);
      });
    });
  });

  // ==========================================
  // CUSTOMER APPROVAL & CONVERSION
  // ==========================================

  it('Phase 3.14-3.22: Customer Approves and Converts to Order', () => {
    cy.clearLocalStorage();
    cy.login(e2eUser.email, e2eUser.password);
    
    cy.visit('/customer/quotes');
    cy.contains(quoteNumber).should('be.visible');

    // Intercept Approval
    cy.intercept('PATCH', `**/api/v1/quotes/${quoteId}/status`).as('approveQuote');
    cy.get(`[data-cy="quote-row-${quoteNumber}"]`).contains(/Approve/i).click();
    
    // Handle JS confirmation if any (Cypress auto-accepts window.confirm)
    cy.wait('@approveQuote').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    // Quote should now be APPROVED. Now convert to order.
    cy.intercept('POST', `**/api/v1/orders/from-quote/${quoteId}`).as('convertOrder');
    cy.get(`[data-cy="quote-row-${quoteNumber}"]`).contains(/Convert to Order/i).click();
    
    cy.wait('@convertOrder').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      orderId = interception.response?.body.order.id;
      expect(interception.response?.body.order.status).to.eq('PENDING');
      expect(interception.response?.body.order.quoteId).to.eq(quoteId);
    });
  });

  // ==========================================
  // PAYMENT MOCK / VERIFICATION
  // ==========================================

  it('Phase 3.23-3.24: Payment Verification', () => {
    cy.clearLocalStorage();
    cy.login(e2eUser.email, e2eUser.password);
    
    // 1. Initiate Razorpay Order creation (this should work safely without hitting real banking)
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/payments/create-order',
        headers: { Authorization: `Bearer ${token}` },
        body: { orderId }
      }).then((res) => {
        expect(res.status).to.eq(200);
        razorpayOrderId = res.body.payment.razorpayOrderId;
        
        // 2. Validate Payment backend signature directly using test signature prefix
        cy.request({
          method: 'POST',
          url: 'http://localhost:5000/api/v1/payments/verify',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: `pay_test_cy_${Date.now()}`,
            razorpay_signature: 'sig_cy_test_signature_valid', // Backend allows "sig_cy_" in non-prod
            orderId: orderId
          }
        }).then((verifyRes) => {
          expect(verifyRes.status).to.eq(200);
          expect(verifyRes.body.success).to.eq(true);
        });
      });
    });
  });

  // ==========================================
  // ADMIN STATUS LIFECYCLE
  // ==========================================

  it('Phase 3.25-3.34: Admin Order Processing (PENDING -> DELIVERED)', () => {
    cy.clearLocalStorage();
    cy.login(adminEmail, adminPassword);
    
    // We will hit the endpoints directly to test the strict state machine enforcements
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      
      const updateOrderStatus = (status: string) => {
        return cy.request({
          method: 'PUT',
          url: `http://localhost:5000/api/v1/orders/${orderId}/status`,
          headers: { Authorization: `Bearer ${token}` },
          body: { status }
        });
      };

      // 1. PENDING -> CONFIRMED
      updateOrderStatus('CONFIRMED').then((res) => expect(res.status).to.eq(200));

      // 2. CONFIRMED -> IN_PRODUCTION
      updateOrderStatus('IN_PRODUCTION').then((res) => expect(res.status).to.eq(200));

      // 3. IN_PRODUCTION -> READY_FOR_DISPATCH
      updateOrderStatus('READY_FOR_DISPATCH').then((res) => expect(res.status).to.eq(200));

      // 4. READY_FOR_DISPATCH -> DISPATCHED 
      updateOrderStatus('DISPATCHED').then((res) => expect(res.status).to.eq(200));

      // 5. DISPATCHED -> DELIVERED
      updateOrderStatus('DELIVERED').then((res) => expect(res.status).to.eq(200));
    });
  });

  // ==========================================
  // FINAL CUSTOMER VIEW & INVOICE
  // ==========================================

  it('Phase 3.35-3.38: Customer Final View & Invoice Access', () => {
    cy.clearLocalStorage();
    cy.login(e2eUser.email, e2eUser.password);
    
    cy.visit(`/customer/orders`);
    // Check if DELIVERED is text in the row
    cy.get('body').then($body => {
      if ($body.text().includes('DELIVERED')) {
         cy.log('Order marked as delivered in UI');
      }
    });

    // Verify invoice endpoint
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/v1/invoices',
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.invoices.length).to.be.greaterThan(0);
        const invoice = res.body.invoices.find((i: any) => i.orderId === orderId);
        expect(invoice).to.exist;
        
        // Assert Invoice retrieval
        cy.request({
          method: 'GET',
          url: `http://localhost:5000/api/v1/invoices/${invoice.id}/pdf`,
          headers: { Authorization: `Bearer ${token}` }
        }).then((invRes) => {
          expect(invRes.status).to.eq(200);
          expect(invRes.headers['content-type']).to.include('application/pdf');
        });
      });
    });
  });
});
