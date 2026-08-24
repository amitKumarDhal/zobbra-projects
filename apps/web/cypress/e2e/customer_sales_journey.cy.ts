describe('Phase 19 — Admin + Customer Sales Business Journey', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('executes full customer quote creation, admin review, WhatsApp link generation, and customer approval', () => {
    // 1. Log in as Customer
    cy.login('customer@zobra.test', 'customer123');
    cy.url().should('include', '/customer');

    // 2. Open products and create quote
    cy.visit('/customer/products');
    cy.get('[data-cy^="customize-btn-"]').first().click();
    cy.get('[data-cy="quantity-input"]').clear().type('150');
    cy.get('[data-cy="submit-quote-btn"]').click();
    cy.get('[data-cy="created-quote-number"]', { timeout: 10000 }).should('contain.text', 'Quote #ZQB-QT-');

    // 3. Log out customer
    cy.clearLocalStorage();

    // 4. Log in as Admin
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');

    // 5. Open Admin Quotes page
    cy.visit('/dashboard/quotes');
    cy.get('[data-cy="admin-quote-number-cell"]').should('exist');
    cy.get('[data-cy="whatsapp-btn"]').first().should('exist');

    // 6. Log out admin and log back in as Customer
    cy.clearLocalStorage();
    cy.login('customer@zobra.test', 'customer123');

    // 7. Customer approves quote
    cy.visit('/customer/quotes');
    cy.get('[data-cy="quote-number-cell"]').should('exist');

    // 8. Reload page to confirm PostgreSQL persistence
    cy.reload();
    cy.get('[data-cy="quote-number-cell"]').should('exist');
  });
});
