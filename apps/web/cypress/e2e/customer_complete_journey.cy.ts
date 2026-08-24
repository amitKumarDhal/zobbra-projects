describe('Phase 18 — Customer Complete Journey', () => {
  beforeEach(() => {
    // Clear local storage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('performs real customer login, product catalog navigation, quote creation and PostgreSQL persistence', () => {
    cy.login('customer@zobra.test', 'customer123');

    // 4. Navigate to Product Catalog
    cy.visit('/customer/products');
    cy.url().should('include', '/customer/products');

    // 5. Select Premium Polo T-Shirt and open customizer
    cy.get('[data-cy^="customize-btn-"]').first().click();

    // 6. Configure specs: Quantity = 100
    cy.get('[data-cy="quantity-input"]').clear().type('100');

    // 7. Submit Quote
    cy.get('[data-cy="submit-quote-btn"]').click();

    // 8. Verify Quote Creation Modal & PostgreSQL Quote Number
    cy.get('[data-cy="created-quote-number"]', { timeout: 10000 }).should('contain.text', 'Quote #ZQB-QT-');

    // 9. Click View in My Quotes
    cy.get('[data-cy="view-my-quotes-btn"]').click();
    cy.url().should('include', '/customer/quotes');

    // 10. Verify Quote appears in Customer Quotes table
    cy.get('[data-cy="quote-number-cell"]').should('exist');

    // 11. Reload page to confirm PostgreSQL persistence
    cy.reload();
    cy.get('[data-cy="quote-number-cell"]').should('exist');
  });
});
