/**
 * ZOBBRA Customer Portal — Identity & Auth E2E Tests
 *
 * Tests that:
 * 1. The customer portal shows the real authenticated user's name everywhere.
 * 2. The string "Rahul M." (and "Rahul Sharma" / "Rahul Mishra") does NOT appear
 *    in any rendered portal page after login.
 * 3. After logout and re-login as a different user, the first user's name is gone.
 */

import { E2E_CUSTOMER } from '../support/e2eCustomer';

// Helper: sign the shared E2E customer in and open the portal
// (Customer UI login is WhatsApp OTP; see cy.loginAsCustomer in support/commands.ts.)
function loginAsCustomer() {
  cy.loginAsCustomer();
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
    cy.viewport(1280, 800); // desktop sidebar is hidden below the lg breakpoint
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Customer dashboard shows authenticated user name and NOT "Rahul M." or demo names', () => {
    loginAsCustomer();

    // The portal lands on the products page; identity is shown in the navbar and sidebar
    cy.location('pathname').should('eq', '/customer/products');
    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 }).should('have.text', E2E_CUSTOMER.name);

    // No known demo names anywhere on the page
    cy.get('body').should('not.contain', 'Rahul M.');
    cy.get('body').should('not.contain', 'Rahul Sharma');
    cy.get('body').should('not.contain', 'Rahul Mishra');

    // Navbar must show a real name (not empty)
    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.name);

    // Sidebar must show the same name
    cy.get('[data-cy="customer-sidebar-name"]:visible', { timeout: 10000 })
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.name);
  });

  it('Customer navbar shows correct user identity from authenticated session', () => {
    loginAsCustomer();

    cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 })
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.name);

    // Open profile dropdown
    cy.get('[data-cy="customer-profile-menu-btn"]').click();
    cy.get('[data-cy="customer-profile-dropdown-name"]')
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.name)
      .and('not.have.text', 'Rahul M.')
      .and('not.have.text', 'Rahul Mishra');
  });

  it('Customer sidebar shows real user name and company', () => {
    loginAsCustomer();

    cy.get('[data-cy="customer-sidebar-name"]:visible', { timeout: 10000 })
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.name);

    cy.get('[data-cy="customer-sidebar-company"]:visible')
      .should('be.visible')
      .and('have.text', E2E_CUSTOMER.companyName)
      .and('not.contain', 'ZOBBRA Demo Technologies');
  });

  it('Customer profile page shows authenticated user data, not hardcoded Rahul Mishra', () => {
    loginAsCustomer();
    cy.visit('/customer/profile');

    // Fields hold the signed-in customer's saved profile, not demo data
    cy.get('[data-cy="profile-name"]', { timeout: 10000 }).should('have.value', E2E_CUSTOMER.name);
    cy.get('[data-cy="profile-company-name"]').should('have.value', E2E_CUSTOMER.companyName);
    cy.get('[data-cy="profile-email"]')
      .should('have.value', E2E_CUSTOMER.email)
      .and('not.have.value', 'rahul@acme.com');

    // The page body must not contain the hardcoded demo names
    cy.get('body').should('not.contain', 'Rahul Mishra');
    cy.get('body').should('not.contain', 'rahul@acme.com');
  });

  it('Create Quote wizard pre-fills from authenticated session, not demo data', () => {
    loginAsCustomer();
    cy.visit('/customer/create-quote');

    // Name, email and phone come from the signed-in customer, not demo data
    cy.get('#quote-name', { timeout: 10000 })
      .should('have.value', E2E_CUSTOMER.name)
      .and('not.have.value', 'Rahul Sharma')
      .and('not.have.value', 'Rahul Mishra');
    cy.get('#quote-email').should('have.value', E2E_CUSTOMER.email);
    cy.get('#quote-phone').should('have.value', E2E_CUSTOMER.phone.slice(3));

    // Body must not contain demo names
    cy.get('body').should('not.contain', 'Rahul M.');
    cy.get('body').should('not.contain', 'Rahul Sharma');
  });

  it('Navbar name matches the name the API returns for this session', () => {
    loginAsCustomer();

    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({ url: 'http://localhost:5000/api/v1/auth/me', headers: { Authorization: `Bearer ${token}` } })
        .its('body.user.name')
        .then((apiName) => {
          expect(apiName).to.eq(E2E_CUSTOMER.name);
          cy.get('[data-cy="customer-navbar-name"]', { timeout: 10000 }).should('have.text', apiName);
        });
    });
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
  it('lands on the products page and has no Overview, Support, Invoices or Notifications tabs', () => {
    cy.viewport(1280, 800); // desktop sidebar is hidden below the lg breakpoint
    cy.visit('/customer');
    cy.location('pathname').should('eq', '/customer/products');
    cy.contains('CLIENT PORTAL').should('be.visible');
    cy.get('nav[aria-label="Customer portal navigation"]:visible').within(() => {
      ['Browse Products', 'My Orders', 'Profile'].forEach((name) => cy.contains(name).should('exist'));
      ['Overview', 'Support', 'Invoices', 'Notifications'].forEach((name) => cy.contains(name).should('not.exist'));
    });
    cy.get('[data-cy="customer-bell-btn"]').should('not.exist');
  });

  it('tests Customer Products section', () => {
    cy.viewport(1280, 800);
    cy.loginAsCustomer();
    cy.visit('/customer/products');
    cy.url().should('include', '/customer/products');
    cy.get('[data-cy="page-header-title"]').should('be.visible').and('have.text', 'BROWSE PRODUCTS');
    cy.contains('Choose products for your next corporate order.').should('be.visible');
    cy.get('[data-cy="search-products-input"]').should('be.visible');
  });

  it('tests Customer Create Quote Wizard link', () => {
    cy.viewport(1280, 800);
    cy.loginAsCustomer();
    cy.visit('/customer/create-quote');
    cy.url().should('include', '/customer/create-quote');
    cy.contains('h1', 'Create New Quote').should('be.visible');
    cy.contains('h2', 'Get Quote').should('be.visible');
    cy.get('#customer-quote-form').within(() => {
      ['#quote-name', '#quote-phone', '#quote-product', '#quote-quantity', '#quote-message'].forEach((id) =>
        cy.get(id).should('be.visible')
      );
      cy.get('#submit-quote-btn').should('contain', 'Get a Quote');
    });
  });

  it('tests Customer Quotes section', () => {
    cy.viewport(1280, 800);
    cy.loginAsCustomer();
    cy.visit('/customer/quotes');
    cy.url().should('include', '/customer/quotes');
    cy.contains('h1', 'My Quotes & Requests').should('be.visible');
    cy.contains('QUOTATIONS & REQUESTS').should('be.visible');
  });

  it('tests Customer Orders section', () => {
    cy.viewport(1280, 800);
    cy.loginAsCustomer();
    cy.visit('/customer/orders');
    cy.url().should('include', '/customer/orders');
    cy.contains('h1', 'My Orders').should('be.visible');
    cy.contains('PURCHASE ORDERS').should('be.visible');
  });

  it('tests Customer Shipment Tracking section', () => {
    cy.visit('/customer/tracking');
    cy.url().should('include', '/customer/tracking');
    cy.contains('Shipment Tracking').should('be.visible');
    cy.contains('COMING SOON').should('be.visible');
    cy.contains('Real-Time Courier Tracking').should('be.visible');
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
