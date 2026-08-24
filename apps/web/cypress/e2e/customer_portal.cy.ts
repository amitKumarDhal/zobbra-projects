describe('Phase 3 — ZOBBRA B2B Customer Portal E2E', () => {
  it('tests Customer Portal Dashboard section', () => {
    cy.visit('/customer');
    cy.url().should('include', '/customer');
    cy.contains('CLIENT PORTAL').should('be.visible');

    // Verify metric cards
    cy.contains('Active Quotes').should('be.visible');
    cy.contains('Approved Quotes').should('be.visible');
    cy.contains('Total Approved Spend').should('be.visible');
  });

  it('tests Customer Products section', () => {
    cy.visit('/customer/products');
    cy.url().should('include', '/customer/products');
    cy.contains('Merchandise Catalog').should('be.visible');
  });

  it('tests Customer Create Quote Wizard link', () => {
    cy.visit('/customer/create-quote');
    cy.url().should('include', '/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');
  });

  it('tests Customer Quotes section', () => {
    cy.visit('/customer/quotes');
    cy.url().should('include', '/customer/quotes');
    cy.contains('My Quotations').should('be.visible');
    cy.contains('QUOTATION RECORDS').should('be.visible');
  });

  it('tests Customer Orders section', () => {
    cy.visit('/customer/orders');
    cy.url().should('include', '/customer/orders');
    cy.contains('My Orders').should('be.visible');
    cy.contains('PURCHASE ORDERS').should('be.visible');
  });

  it('tests Customer Shipment Tracking section', () => {
    cy.visit('/customer/tracking');
    cy.url().should('include', '/customer/tracking');
    cy.contains('Shipment Tracking').should('be.visible');
    cy.contains('BLUEDART-9922').should('be.visible');
    cy.contains('BlueDart Express').should('be.visible');
  });

  it('tests Customer Invoices section', () => {
    cy.visit('/customer/invoices');
    cy.url().should('include', '/customer/invoices');
    cy.contains('Tax Invoices').should('be.visible');
    cy.contains('INV-2026-088').should('be.visible');
  });

  it('tests Customer Notifications section', () => {
    cy.visit('/customer/notifications');
    cy.url().should('include', '/customer/notifications');
    cy.contains('Notification Center').should('be.visible');
  });

  it('tests Customer Support section', () => {
    cy.visit('/customer/support');
    cy.url().should('include', '/customer/support');
    cy.contains('Customer Support').should('be.visible');
    cy.contains('Dedicated Account Manager').should('be.visible');
  });

  it('tests Customer Profile section', () => {
    cy.visit('/customer/profile');
    cy.url().should('include', '/customer/profile');
    cy.contains('Company Profile & Settings').should('be.visible');
    cy.contains('Company & GST Information').should('be.visible');
  });
});
