describe('Zobra Dashboard E2E', () => {
  it('loads the admin dashboard and verifies branding, navigation, and KPIs', () => {
    // 1. Login and Visit /dashboard
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard');

    // 2. Verify dashboard loads successfully
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard').should('be.visible');

    // 3. Verify Zobra branding
    cy.contains(/ZOBBRA|ZOBRA/i).should('be.visible');

    // 4. Verify sidebar navigation is visible
    cy.get('aside').should('be.visible');

    // 5. Verify Dashboard navigation is available
    cy.get('aside').contains('Dashboard').should('be.visible');

    // 6. Verify important current dashboard KPI sections
    cy.contains('Total Inquiries').should('be.visible');
    cy.contains('Quotes Sent').should('be.visible');
    cy.contains('Orders Received').should('be.visible');
    cy.contains('Revenue').should('be.visible');

    // 7. Verify page does not contain uncaught error messages
    cy.contains(/uncaught|error|exception/i).should('not.exist');

    // 8. Verify the dashboard is usable
    cy.contains('Inquiry Overview').should('be.visible');
    cy.contains('Recent Inquiries').should('be.visible');
    cy.contains('Recent Activity').should('be.visible');
  });
});
