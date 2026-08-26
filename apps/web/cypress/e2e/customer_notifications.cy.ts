/// <reference types="cypress" />

describe('Customer Portal Notifications Module: Coming Soon Experience', () => {
  beforeEach(() => {
    cy.login('customer@zobra.test', 'customer123');
  });

  it('1. Renders /customer/notifications with professional Coming Soon card and no mock data', () => {
    cy.visit('/customer/notifications');
    cy.url().should('include', '/customer/notifications');

    // Page header assertions
    cy.contains('COMING SOON').should('be.visible');
    cy.contains('h1', 'Notification Center').should('be.visible');
    cy.contains('Stay updated on quotes, orders, payments, production, and delivery.').should('be.visible');

    // Coming Soon card assertions
    cy.contains('Real-Time Notifications').should('be.visible');
    cy.contains("We're building real-time notifications to keep you informed about important activity across your account.").should('be.visible');
    cy.contains("You'll be notified here when this feature is available.").should('be.visible');

    // Future roadmap categories
    cy.contains("What You'll Receive Here").should('be.visible');
    cy.contains('Quotation Alerts').should('be.visible');
    cy.contains('Order Status & Milestones').should('be.visible');
    cy.contains('Payment & Invoicing').should('be.visible');
    cy.contains('Dispatch & Delivery').should('be.visible');

    // Verify Action Buttons
    cy.get('[data-cy="back-to-orders-btn"]').should('be.visible');
    cy.get('[data-cy="view-quotes-btn"]').should('be.visible');
  });

  it('2. Asserts NO fake/mock notification cards or fake timestamps exist', () => {
    cy.visit('/customer/notifications');

    // Confirm removal of previous hardcoded demo items
    cy.contains('Digital 3D Proof Ready').should('not.exist');
    cy.contains('Order #ORD-5001 has entered the Packing stage').should('not.exist');
    cy.contains('Invoice #INV-2026-088 generated for ₹28,900').should('not.exist');
    cy.contains('15 mins ago').should('not.exist');
    cy.contains('2 hours ago').should('not.exist');
  });

  it('3. Verifies Customer Navbar bell button and Coming Soon dropdown behavior', () => {
    cy.visit('/customer');
    cy.get('body').should('contain.text', 'ZOBBRA');

    // Bell button should exist without fake unread badges or counters
    cy.get('[data-cy="customer-bell-btn"]').should('be.visible');
    cy.get('[data-cy="customer-bell-btn"]').find('.animate-pulse').should('not.exist');
    cy.contains('1 New').should('not.exist');

    // Click bell button to toggle dropdown
    cy.get('[data-cy="customer-bell-btn"]').click();
    cy.get('[data-cy="customer-notifications-dropdown"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="customer-notifications-dropdown"]').contains('Coming Soon').should('be.visible');
    cy.get('[data-cy="customer-notifications-dropdown"]').contains('Real-time alerts for quotes, orders, and shipments will be available soon.').should('be.visible');

    // Click link to open full notification page
    cy.get('[data-cy="customer-view-all-notifications-link"]').click();
    cy.url().should('include', '/customer/notifications');
  });

  it('4. Action buttons navigate to respective customer portals', () => {
    cy.visit('/customer/notifications');

    cy.get('[data-cy="back-to-orders-btn"]').click();
    cy.url().should('include', '/customer/orders');

    cy.visit('/customer/notifications');
    cy.get('[data-cy="view-quotes-btn"]').click();
    cy.url().should('include', '/customer/quotes');
  });
});
