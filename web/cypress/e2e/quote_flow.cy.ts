describe('ZOBBRA B2B SaaS Quote & Order Workflow', () => {
  it('Navigates from homepage to Polo T-Shirt product detail and submits quote request', () => {
    cy.visit('http://localhost:3000');
    cy.contains('Custom T-Shirts & Corporate Merchandise Printing').should('be.visible');

    // Click on Polo T-Shirt product
    cy.contains('Customized Polo T-Shirt').click();

    // Verify bulk pricing matrix table
    cy.contains('BULK ORDER PRICING').should('be.visible');
    cy.contains('Front Only').should('be.visible');

    // Click GET A FREE QUOTE
    cy.contains('GET A FREE QUOTE').click();
    cy.contains('Quote Request Submitted').should('be.visible');
  });

  it('Logs into Admin Dashboard and views production Kanban board', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('Sign in to Zobra').should('be.visible');

    // Click Admin autofill and submit
    cy.contains('Admin').click();
    cy.contains('SIGN IN').click();

    // Verify Dashboard navigation
    cy.url().should('include', '/admin');
    cy.contains('Dashboard Overview').should('be.visible');

    // Navigate to Production Kanban
    cy.contains('Production Kanban').click();
    cy.contains('Production Kanban Board').should('be.visible');
    cy.contains('Printing').should('be.visible');
  });
});
