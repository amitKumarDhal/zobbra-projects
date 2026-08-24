describe('ZOBBRA Customer Portal — Canonical Design System Validation', () => {
  beforeEach(() => {
    cy.login('customer@zobra.test', 'customer123');
  });

  it('1. Verifies Customer Dashboard layout, StatCards, and typography', () => {
    cy.visit('/customer', { failOnStatusCode: false });
    cy.url().should('include', '/customer');
    cy.contains('CLIENT PORTAL').should('be.visible');
    cy.contains('Active Quotes').should('be.visible');
    cy.contains('Approved Quotes').should('be.visible');
    cy.contains('Total Approved Spend').should('be.visible');
    cy.get('[data-cy="create-quote-cta"]').should('be.visible');
    cy.get('[data-cy="browse-products-cta"]').should('be.visible');
  });

  it('2. Verifies Merchandise Catalog, filter toolbar, and product cards', () => {
    cy.visit('/customer/products');
    cy.url().should('include', '/customer/products');
    cy.contains('Merchandise Catalog').should('be.visible');
    cy.get('[data-cy="search-products-input"]').should('be.visible');
    cy.contains('ALL').should('be.visible');
    cy.contains('Apparel').should('be.visible');
  });

  it('3. Verifies 8-Step Create Quote Wizard UI & steps', () => {
    cy.visit('/customer/create-quote');
    cy.url().should('include', '/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');
    cy.contains('Step 1: Choose Product Category').should('be.visible');
    cy.contains('LIVE PROOF SUMMARY').should('be.visible');
  });

  it('4. Verifies My Quotes page table and StatusBadges', () => {
    cy.visit('/customer/quotes');
    cy.url().should('include', '/customer/quotes');
    cy.contains('My Quotations').should('be.visible');
    cy.contains('QUOTATION RECORDS').should('be.visible');
    cy.get('[data-cy="create-quote-btn"]').should('be.visible');
  });

  it('5. Verifies My Orders page table and actions', () => {
    cy.visit('/customer/orders');
    cy.url().should('include', '/customer/orders');
    cy.contains('My Orders').should('be.visible');
    cy.contains('PURCHASE ORDERS').should('be.visible');
  });

  it('6. Verifies Shipment Tracking milestone timeline', () => {
    cy.visit('/customer/tracking');
    cy.url().should('include', '/customer/tracking');
    cy.contains('Shipment Tracking').should('be.visible');
    cy.contains('EXPRESS SHIPPING').should('be.visible');
    cy.contains('AWB #BLUEDART-9922').should('be.visible');
  });

  it('7. Verifies Tax Invoices page and GST records', () => {
    cy.visit('/customer/invoices');
    cy.url().should('include', '/customer/invoices');
    cy.contains('Tax Invoices').should('be.visible');
    cy.contains('GST BILLING').should('be.visible');
    cy.contains('INV-2026-088').should('be.visible');
  });

  it('8. Verifies Notification Center tabs and cards', () => {
    cy.visit('/customer/notifications');
    cy.url().should('include', '/customer/notifications');
    cy.contains('Notification Center').should('be.visible');
    cy.contains('NOTIFICATIONS').should('be.visible');
  });

  it('9. Verifies Customer Support helpdesk & tickets list', () => {
    cy.visit('/customer/support');
    cy.url().should('include', '/customer/support');
    cy.contains('Customer Support').should('be.visible');
    cy.contains('Dedicated Account Manager').should('be.visible');
    cy.contains('Priority Email Desk').should('be.visible');
    cy.contains('My Support Tickets').should('be.visible');
    cy.contains('TCK-551').should('be.visible');
    cy.contains('Change Print Placement for Order #ORD-5001').should('be.visible');
  });

  it('10. Verifies Company Profile & Settings form', () => {
    cy.visit('/customer/profile');
    cy.url().should('include', '/customer/profile');
    cy.contains('Company Profile & Settings').should('be.visible');
    cy.contains('Company & GST Information').should('be.visible');
    cy.contains('Primary Contact Person').should('be.visible');
  });

  it('11. Verifies Payment Success & Failed callback views', () => {
    cy.visit('/customer/payment/success?orderNumber=ZOB-ORD-1001&amount=28900&paymentId=pay_test_998');
    cy.contains('Payment Successful').should('be.visible');
    cy.contains('ZOB-ORD-1001').should('be.visible');

    cy.visit('/customer/payment/failed?orderNumber=ZOB-ORD-1001&reason=Test%20Decline');
    cy.contains('Payment Failed').should('be.visible');
  });

  it('12. Verifies Design System Showcase has canonical tokens & components', () => {
    cy.visit('/design-system');
    cy.contains('Zobra Design Tokens & Primitives').should('be.visible');
    cy.contains('Canonical Design System').should('be.visible');
    cy.contains('#3B6FEB').should('be.visible');
    cy.contains('#111111').should('be.visible');
    cy.contains('#F8F9FC').should('be.visible');
  });
});
