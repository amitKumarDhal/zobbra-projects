/// <reference types="cypress" />

describe('Admin Portal Notifications Module: Coming Soon Experience', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
  });

  it('1. Renders /dashboard/notifications with professional Coming Soon card and no mock data', () => {
    cy.visit('/dashboard/notifications');
    cy.url().should('include', '/dashboard/notifications');

    // Page header assertions
    cy.contains('COMING SOON').should('be.visible');
    cy.contains('h1', 'Admin Notification Center').should('be.visible');
    cy.contains('Real-time alerts for inquiries, quotes, orders, payments, production, and team activity will be available soon.').should('be.visible');

    // Coming Soon card assertions
    cy.contains('Real-Time Administrative Alerts').should('be.visible');
    cy.contains("We're building real-time notifications to keep the management, sales, and operations teams fully synchronized.").should('be.visible');
    cy.contains('Real-time notification feeds, browser alerts, and automated operational triggers will be displayed here in a future release.').should('be.visible');

    // Planned operational alert categories
    cy.contains('Planned Operational Alert Categories').should('be.visible');
    cy.contains('New Inquiries & Leads').should('be.visible');
    cy.contains('Quote Approvals & Revisions').should('be.visible');
    cy.contains('Payments & Revenue').should('be.visible');
    cy.contains('Order Milestones').should('be.visible');
    cy.contains('Dispatch & Logistics').should('be.visible');
    cy.contains('Customer Registrations').should('be.visible');

    // Verify Action Buttons
    cy.get('[data-cy="back-to-dashboard-btn"]').should('be.visible');
    cy.get('[data-cy="admin-view-orders-btn"]').should('be.visible');
    cy.get('[data-cy="admin-view-quotes-btn"]').should('be.visible');
  });

  it('2. Asserts NO fake/mock notification cards or fake count 5 exist in UI', () => {
    cy.visit('/dashboard/notifications');

    // Confirm removal of previous hardcoded demo items
    cy.contains('New Inquiry Received').should('not.exist');
    cy.contains('Rakesh Kumar requested a quote for Corporate T-Shirts').should('not.exist');
    cy.contains('Order #ZB-2024-032 payment received successfully').should('not.exist');
  });

  it('3. Verifies Admin Navbar bell button and Coming Soon dropdown behavior', () => {
    cy.visit('/dashboard');
    cy.get('body').should('contain.text', 'ZOBBRA');

    // Bell button should exist without fake badge "5"
    cy.get('[data-cy="admin-bell-btn"]').should('be.visible');
    cy.get('[data-cy="admin-bell-btn"]').contains('5').should('not.exist');

    // Click bell button to toggle dropdown
    cy.get('[data-cy="admin-bell-btn"]').click();
    cy.get('[data-cy="admin-notifications-dropdown"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="admin-notifications-dropdown"]').contains('Coming Soon').should('be.visible');
    cy.get('[data-cy="admin-notifications-dropdown"]').contains('Real-time alerts for new inquiries, quote approvals, payments, and orders will be available soon.').should('be.visible');

    // Click link to open full notification page
    cy.get('[data-cy="admin-view-all-notifications-link"]').click();
    cy.url().should('include', '/dashboard/notifications');
  });

  it('4. Action buttons navigate to respective admin dashboard pages', () => {
    cy.visit('/dashboard/notifications');

    cy.get('[data-cy="back-to-dashboard-btn"]').click();
    cy.url().should('eq', 'http://localhost:3000/dashboard');

    cy.visit('/dashboard/notifications');
    cy.get('[data-cy="admin-view-orders-btn"]').click();
    cy.url().should('include', '/dashboard/orders');

    cy.visit('/dashboard/notifications');
    cy.get('[data-cy="admin-view-quotes-btn"]').click();
    cy.url().should('include', '/dashboard/quotes');
  });
});
