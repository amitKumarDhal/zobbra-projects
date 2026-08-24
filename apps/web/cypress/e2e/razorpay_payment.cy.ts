describe('Razorpay Test Mode Payment MVP End-to-End Journey', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('executes full quote creation, quote to order conversion, Razorpay test payment, and server verification', () => {
    // 1. Log in as Customer
    cy.login('customer@zobra.test', 'customer123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer');

    // 2. Customer creates quote for Premium Polo T-Shirt
    cy.visit('/customer/products');
    cy.get('[data-cy^="customize-btn-"]').first().click();
    cy.get('[data-cy="quantity-input"]').clear().type('300');
    cy.get('[data-cy="submit-quote-btn"]').click();
    cy.get('[data-cy="created-quote-number"]', { timeout: 10000 }).should('contain.text', 'Quote #ZQB-QT-');

    // 3. Customer approves quote in My Quotes
    cy.visit('/customer/quotes');
    cy.get('[data-cy="quote-number-cell"]', { timeout: 10000 }).should('exist');
    cy.get('tbody tr').first().contains('button', 'APPROVE').click();

    // 4. Convert approved quote to order
    cy.get('tbody tr').first().contains('button', 'CONVERT TO ORDER').click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer/orders');

    // 5. Customer Orders List - Wait for API response and click PAY NOW
    cy.get('[data-cy="order-number-cell"]', { timeout: 10000 }).should('exist');
    cy.get('tbody tr').first().contains('button', 'VIEW ORDER').click();

    // 6. Order Detail Page - Click PAY NOW button
    cy.location('pathname', { timeout: 10000 }).should('include', '/customer/orders/');
    cy.get('[data-cy="pay-now-btn"]', { timeout: 10000 }).click();

    // 7. Verify Payment Success Page & Order status updated to PAID
    cy.location('pathname', { timeout: 15000 }).should('include', '/customer/payment/success');
    cy.get('[data-cy="success-order-number"]', { timeout: 10000 }).should('exist');

    // 8. Return to Customer Orders list and verify Paid
    cy.visit('/customer/orders');
    cy.get('[data-cy="payment-status-cell"]', { timeout: 10000 }).first().should('contain.text', 'Paid');

    // 9. Log out Customer & log in Admin to verify payment status in Admin Operations Desk
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');

    cy.visit('/dashboard/orders');
    cy.get('[data-cy="admin-order-number"]', { timeout: 10000 }).first().should('exist');
    cy.get('[data-cy="admin-payment-status"]', { timeout: 10000 }).first().should('contain.text', 'Paid');
    cy.get('[data-cy="admin-payment-id"]', { timeout: 10000 }).first().should('not.contain.text', 'N/A');
  });
});
