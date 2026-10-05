/**
 * Fresh development customer journey with the REAL development OTP.
 *
 * Needs the API running with NODE_ENV=development + DEV_AUTH_OTP_MODE=console and
 * its console captured to a file passed as CYPRESS_DEV_API_LOG. Nothing is stubbed:
 * the code is generated, stored and verified by the normal OTP service, and read
 * back from the server log exactly as a developer would.
 */

const API = 'http://localhost:5000/api/v1';
const logFile = Cypress.env('DEV_API_LOG') as string | undefined;

// Fresh Indian mobile each run: 9 + 9 digits
const national = `9${String(Date.now()).slice(-9)}`;
const phone = `+91${national}`;

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Fresh development customer journey (dev OTP)', () => {
  let token = '';
  let customerId = '';
  let quoteId = '';
  let quoteNumber = '';
  let orderId = '';

  before(function () {
    if (!logFile) this.skip();
  });

  it('1–7: requests an OTP, reads it from the server console, verifies and lands on /customer', () => {
    cy.clearLocalStorage();
    cy.intercept('POST', '**/auth/otp/request').as('otpRequest');
    cy.intercept('POST', '**/auth/otp/verify').as('otpVerify');

    cy.visit('/login');
    cy.get('[data-cy="otp-phone-input"]').type(national);
    cy.get('[data-cy="otp-send-button"]').click();
    cy.wait('@otpRequest').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(JSON.stringify(response?.body)).not.to.match(/\b\d{6}\b/); // code never in the API response
    });

    cy.task('devOtpFromServerLog', { phone, logFile }).then((code) => {
      expect(code, 'dev OTP printed by the server').to.match(/^\d{6}$/);
      cy.get('[data-cy="otp-digit-0"]').type(String(code));
    });
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@otpVerify').its('response.statusCode').should('eq', 200);

    cy.location('pathname', { timeout: 15000 }).should('eq', '/customer/products');
    cy.window().then((win) => {
      token = win.localStorage.getItem('token') || '';
      const user = JSON.parse(win.localStorage.getItem('user') || '{}');
      expect(user.role).to.eq('CUSTOMER');
      customerId = user.id;
    });
  });

  it('the customer cannot open the admin dashboard', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', token);
    });
    cy.visit('/dashboard');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    cy.request({ url: `${API}/agents`, headers: bearer(token), failOnStatusCode: false }).its('status').should('eq', 403);
  });

  it('8–13: browses the catalog, opens and customizes a product, prices it', () => {
    cy.request(`${API}/products`).then(({ body }) => {
      const product = (body.products || []).find((p: any) => p.isActive !== false);
      expect(product, 'an active catalog product').to.exist;

      cy.visit('/products');
      cy.contains(product.name, { timeout: 15000 }).should('exist');
      cy.visit(`/products/${product.id}`);
      cy.contains(product.name, { timeout: 15000 }).should('exist');
      cy.visit(`/products/${product.id}/customize`);
      cy.get('canvas', { timeout: 20000 }).should('exist');

      cy.request({
        method: 'POST',
        url: `${API}/quotes/pricing-preview`,
        headers: bearer(token),
        body: { productId: product.id, quantity: 50, printType: 'Front Only' },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.success).to.eq(true);
      });

      // 14: create the quote as this customer, trying to claim someone else's identity
      cy.request({
        method: 'POST',
        url: `${API}/quotes`,
        headers: bearer(token),
        body: {
          productId: product.id,
          quantity: 50,
          printType: 'Front Only',
          name: 'Dev Journey Customer',
          phone,
          artworkUrl: 'https://res.cloudinary.com/demo/image/upload/sample.png',
          customerId: '00000000-0000-0000-0000-000000000000',
          companyId: '00000000-0000-0000-0000-000000000000',
        },
      }).then((res) => {
        expect(res.status).to.eq(201);
        quoteId = res.body.quote.id;
        quoteNumber = res.body.quote.quoteNumber;
      });
    });
  });

  it('15: the quote belongs to the authenticated customer and shows in their portal', () => {
    cy.request({ url: `${API}/quotes/${quoteId}`, headers: bearer(token) }).then(({ body }) => {
      expect(body.quote.customerId).to.eq(customerId);
      expect(body.quote.companyId).to.eq(null);
    });
    cy.window().then((win) => win.localStorage.setItem('token', token));
    cy.visit('/customer/quotes');
    cy.contains(quoteNumber, { timeout: 15000 }).should('exist');
  });

  it('16: admin sends → customer approves and converts → admin records payment → customer sees it paid', () => {
    cy.request('POST', `${API}/auth/login`, { email: 'admin@zobra.test', password: 'admin123' }).then(({ body: admin }) => {
      cy.request({ method: 'PUT', url: `${API}/quotes/${quoteId}/status`, headers: bearer(admin.token), body: { status: 'SENT' } });
      cy.request({ method: 'PUT', url: `${API}/quotes/${quoteId}/status`, headers: bearer(token), body: { status: 'APPROVED' } })
        .its('status')
        .should('eq', 200);
      cy.request({ method: 'POST', url: `${API}/orders/from-quote/${quoteId}`, headers: bearer(token) }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        orderId = res.body.order.id;
        expect(res.body.order.customerId).to.eq(customerId);

        cy.request({
          method: 'POST',
          url: `${API}/payments/record`,
          headers: bearer(admin.token),
          body: { orderId, amount: res.body.order.totalAmount, method: 'BANK_TRANSFER', reference: `DEV-${Date.now()}` },
        })
          .its('status')
          .should('eq', 200);
      });
    });

    cy.window().then((win) => win.localStorage.setItem('token', token));
    cy.then(() => cy.visit(`/customer/orders/${orderId}`));
    cy.contains('PAYMENT COMPLETED & VERIFIED', { timeout: 15000 }).should('exist');
  });
});
