describe('Phase 4 — Admin Operations E2E', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
  });

  it('tests Admin Products Manager', () => {
    cy.visit('/dashboard/products');
    cy.url().should('include', '/dashboard/products');
    cy.get('h1').contains('Products').should('be.visible');
  });

  it('tests Admin Customers Directory', () => {
    cy.visit('/dashboard/customers');
    cy.url().should('include', '/dashboard/customers');
    cy.get('h1').contains('Customers').should('be.visible');
  });

  it('tests Admin Quotes Management', () => {
    cy.visit('/dashboard/quotes');
    cy.url().should('include', '/dashboard/quotes');
    cy.get('h1').contains('Quote').should('be.visible');
  });

  it('tests Admin Orders Pipeline', () => {
    cy.visit('/dashboard/orders');
    cy.url().should('include', '/dashboard/orders');
    cy.get('h1').contains('Orders').should('be.visible');
  });

  it('tests Admin System Settings', () => {
    cy.visit('/dashboard/settings');
    cy.url().should('include', '/dashboard/settings');
    cy.get('h1').contains('Settings').should('be.visible');
  });
});
