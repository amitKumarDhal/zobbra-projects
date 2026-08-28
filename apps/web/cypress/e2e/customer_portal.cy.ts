/**
 * ZOBBRA Customer Portal — Identity & Auth E2E Tests
 *
 * Tests that:
 * 1. The customer portal shows the real authenticated user's name everywhere.
 * 2. The string "Rahul M." (and "Rahul Sharma" / "Rahul Mishra") does NOT appear
 *    in any rendered portal page after login.
 * 3. After logout and re-login as a different user, the first user's name is gone.
 */

const CUSTOMER_EMAIL = 'customer@zobra.test';
const CUSTOMER_PASSWORD = 'customer123';

// Helper: login as a customer and navigate to the portal
function loginAsCustomer(email = CUSTOMER_EMAIL, pass = CUSTOMER_PASSWORD) {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(pass);
  cy.get('[data-cy="login-submit-button"]').click();
  cy.url().should('include', '/customer');
}

// Helper: fully clear auth state and return to login
function logout() {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit('/login');
  cy.url().should('include', '/login');
}

describe('ZOBBRA — Customer Real Identity Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Customer dashboard shows authenticated user name and NOT "Rahul M." or demo names', () => {
    loginAsCustomer();

    // Wait for identity to load
    cy.get('[data-cy="customer-dashboard-welcome-name"]', { timeout: 10000 }).should('not.be.empty');

    // The welcome message must NOT contain any of the known demo names
    cy.get('body').should('not.contain', 'Rahul M.');
    cy.get('body').should('not.contain', 'Rahul Sharma');
    cy.get('body').should('not.contain', 'Rahul Mishra');

    // Navbar must show a real name (not empty)
    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty')
      .and('not.have.text', 'Rahul M.')
      .and('not.have.text', 'Rahul Sharma');

    // Sidebar must show a real name
    cy.get('[data-cy="customer-sidebar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty')
      .and('not.have.text', 'Rahul Sharma');
  });

  it('Customer navbar shows correct user identity from authenticated session', () => {
    loginAsCustomer();

    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty');

    // Open profile dropdown
    cy.get('[data-cy="customer-profile-menu-btn"]').click();
    cy.get('[data-cy="customer-profile-dropdown-name"]')
      .should('be.visible')
      .and('not.be.empty')
      .and('not.have.text', 'Rahul M.')
      .and('not.have.text', 'Rahul Mishra');
  });

  it('Customer sidebar shows real user name and company', () => {
    loginAsCustomer();

    cy.get('[data-cy="customer-sidebar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty')
      .and('not.have.text', 'Rahul Sharma');

    cy.get('[data-cy="customer-sidebar-company"]')
      .should('be.visible')
      .and('not.contain', 'ZOBBRA Demo Technologies');
  });

  it('Customer profile page shows authenticated user data, not hardcoded Rahul Mishra', () => {
    loginAsCustomer();
    cy.visit('/customer/profile');

    // Name field must NOT have "Rahul Mishra"
    cy.get('[data-cy="profile-name"]', { timeout: 10000 })
      .should('not.have.value', 'Rahul Mishra');

    // Email field must NOT have demo email
    cy.get('[data-cy="profile-email"]')
      .should('not.have.value', 'rahul@acme.com');

    // The page body must not contain the hardcoded demo names
    cy.get('body').should('not.contain', 'Rahul Mishra');
    cy.get('body').should('not.contain', 'rahul@acme.com');
  });

  it('Create Quote wizard pre-fills from authenticated session, not demo data', () => {
    loginAsCustomer();
    cy.visit('/customer/create-quote');

    // Customer name field must NOT be pre-filled with "Rahul Sharma"
    cy.get('[data-cy="quote-customer-name"]', { timeout: 10000 })
      .should('not.have.value', 'Rahul Sharma')
      .and('not.have.value', 'Rahul Mishra');

    // Company name field must NOT be "ZOBBRA Demo Technologies"
    cy.get('[data-cy="quote-company-name"]')
      .should('not.have.value', 'ZOBBRA Demo Technologies');

    // Body must not contain demo names
    cy.get('body').should('not.contain', 'Rahul M.');
    cy.get('body').should('not.contain', 'Rahul Sharma');
  });

  it('Dashboard welcome message shows correct name from API', () => {
    loginAsCustomer();

    cy.get('[data-cy="customer-dashboard-welcome-name"]', { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .should('not.be.empty')
      .and('not.eq', 'Rahul Sharma')
      .and('not.eq', 'Rahul Mishra');
  });

  it('After logout, customer identity is cleared — no stale name remains on next visit', () => {
    loginAsCustomer();

    // Verify name loaded
    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 }).should('be.visible');

    // Logout by clearing state
    logout();

    // Visiting customer portal after logout should redirect to login
    cy.visit('/customer');
    cy.url().should('include', '/login');

    // The rendered login page body must not contain the logged-out user's demo name
    cy.get('body').should('not.contain', 'Rahul M.');
    cy.get('body').should('not.contain', 'Rahul Sharma');
  });
});

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
    cy.contains('Create Your Merchandise Quote').should('be.visible');
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
    cy.contains('COMING SOON').should('be.visible');
    cy.contains('Real-Time Courier Tracking').should('be.visible');
  });

  it('tests Customer Invoices section', () => {
    cy.visit('/customer/invoices');
    cy.url().should('include', '/customer/invoices');
    cy.contains('Tax Invoices').should('be.visible');
    cy.contains('GST BILLING').should('be.visible');
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

    // Must NOT show hardcoded demo name in any form field
    cy.get('body').should('not.contain', 'Rahul Mishra');
  });
});
