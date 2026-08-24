describe('Zobra Complete MVP End-to-End Real Business Journey', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('executes full business journey: Customer Login -> Product -> Quote -> PostgreSQL -> Admin Quote -> WhatsApp -> Repricing -> Customer Approval -> Order Conversion -> Payment', () => {
    // 1. CUSTOMER LOGIN
    cy.login('customer@zobra.test', 'customer123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer');

    // 2. PRODUCT CATALOG & SELECTION
    cy.visit('/customer/products');
    cy.get('[data-cy^="customize-btn-"]').first().click();

    // 3. CONFIGURE & CREATE QUOTE (PostgreSQL backend)
    cy.get('[data-cy="quantity-input"]').clear().type('250');
    cy.get('[data-cy="submit-quote-btn"]').click();
    cy.get('[data-cy="created-quote-number"]', { timeout: 10000 }).should('contain.text', 'Quote #ZQB-QT-');

    // 4. VERIFY QUOTE IN CUSTOMER PORTAL & PERSISTENCE
    cy.visit('/customer/quotes');
    cy.get('[data-cy="quote-number-cell"]', { timeout: 10000 }).should('exist');
    cy.reload();
    cy.get('[data-cy="quote-number-cell"]', { timeout: 10000 }).should('exist');

    // 5. ADMIN LOG IN & QUOTE REVIEW
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');

    cy.visit('/dashboard/quotes');
    cy.contains('Loading quotes...').should('not.exist');
    cy.get('tbody tr').first().find('td').eq(1).click(); // Open drawer
    cy.get('[data-cy="admin-view-quote-btn"]').first().click();

    // 6. WHATSAPP & REPRICING IN ADMIN QUOTE DETAIL
    cy.get('[data-cy="whatsapp-link"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="admin-update-qty-btn"]', { timeout: 10000 }).click();
    cy.get('[data-cy="admin-qty-input"]').focus().type('{selectall}{backspace}300');
    cy.get('[data-cy="admin-save-quote-btn"]').click();
    cy.get('[data-cy="admin-update-qty-btn"]').should('be.visible');

    // 7. CUSTOMER LOGIN & APPROVAL
    cy.clearLocalStorage();
    cy.login('customer@zobra.test', 'customer123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer');
    cy.visit('/customer/quotes');

    cy.get('tbody tr').first().contains('button', 'APPROVE', { timeout: 10000 }).click();

    // 8. CONVERT TO ORDER
    cy.get('tbody tr').first().contains('button', 'CONVERT TO ORDER', { timeout: 10000 }).click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer/orders');

    // 9. CUSTOMER ORDER & PAYMENT (Razorpay Test Mode)
    cy.get('[data-cy="order-number-cell"]', { timeout: 10000 }).should('exist');
    cy.get('tbody tr').first().find('[data-cy="order-pay-now-btn"]', { timeout: 10000 }).click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer/orders/');

    cy.get('[data-cy="pay-now-btn"]', { timeout: 10000 }).click();
    cy.location('pathname', { timeout: 15000 }).should('include', '/customer/payment/success');
    cy.get('[data-cy="success-order-number"]', { timeout: 10000 }).should('exist');

    // 10. VERIFY ORDER PAID IN CUSTOMER & ADMIN PORTALS
    cy.visit('/customer/orders');
    cy.get('[data-cy="payment-status-cell"]', { timeout: 10000 }).first().should('contain.text', 'Paid');

    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');
    cy.visit('/dashboard/orders');
    cy.get('[data-cy="admin-order-number"]', { timeout: 10000 }).first().should('exist');
    cy.get('[data-cy="admin-payment-status"]', { timeout: 10000 }).first().should('contain.text', 'Paid');
  });
});
