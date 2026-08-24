describe('Phase 5 — Complete ZOBBRA B2B Business Journey E2E', () => {
  it('executes the full B2B merchandise workflow across storefront, customer portal, and admin desk', () => {
    // 1. Customer: Browse Product Catalog
    cy.visit('/products');
    // Wait for any product to appear first (API fetch has 300ms debounce)
    cy.get('h3', { timeout: 10000 }).should('exist');
    // Search for the polo product to confirm it exists
    cy.get('input[placeholder*="Search merchandise"]').type('Polo');
    cy.contains('Premium Polo T-Shirt', { timeout: 8000 }).should('be.visible');
    cy.get('input[placeholder*="Search merchandise"]').clear();

    // 2. Customer: Open Product Detail Page (navigate directly by known slug)
    cy.visit('/products/polo-200gsm');
    cy.contains('Premium Polo T-Shirt', { timeout: 8000 }).should('be.visible');

    // 3. Customer: Configure Product
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('button', 'XL').click();
    cy.contains('Live Estimate').should('be.visible');

    // 4. Customer: Launch Configurator Wizard
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');

    // Step through configurator
    cy.contains('button', 'NEXT STEP').click(); // Step 2
    cy.contains('button', 'NEXT STEP').click(); // Step 3
    cy.contains('button', 'NEXT STEP').click(); // Step 4
    cy.contains('button', 'NEXT STEP').click(); // Step 5
    cy.contains('button', 'NEXT STEP').click(); // Step 6
    cy.contains('ATTACH SAMPLE FILE').click();
    cy.contains('button', 'NEXT STEP').click(); // Step 7
    cy.contains('button', 'NEXT STEP').click(); // Step 8

    // 5. Customer: Submit Quote
    cy.contains('button', 'SUBMIT QUOTE').click();
    cy.contains('Configurator Quote Submitted!').should('be.visible');

    // 6. Admin: Review Quotations Desk
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/quotes');
    cy.contains('Loading quotes...').should('not.exist');

    // 7. Admin: Order Pipeline Desk
    cy.visit('/dashboard/orders');
    cy.contains('Loading orders...').should('not.exist');

    // 8. Admin Operations: Task & Todo Desk
    cy.visit('/dashboard/todo');
    cy.contains('h1', 'To Do').should('be.visible');

    // 9. Admin Reports & Analytics Desk
    cy.visit('/dashboard/reports');
    cy.contains('Reports & Analytics').should('be.visible');

    // 10. Customer: Track Shipment in Client Portal
    cy.clearLocalStorage();
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/tracking');
    cy.contains('Shipment Tracking').should('be.visible');
    cy.contains('BLUEDART-9922').should('be.visible');
    cy.contains('BlueDart Express').should('be.visible');
  });
});
