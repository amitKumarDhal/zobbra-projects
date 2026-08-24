describe('Approved Quote to Order MVP E2E Journey', () => {
  it('executes full quote submission, admin approval, quote-to-order conversion, order persistence, and customer-admin synchronization', () => {
    // 1. Customer: Create quote in 8-step wizard
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');

    // Progress through wizard steps
    cy.contains('Polo T-Shirts (200 GSM)').click();
    cy.contains('button', 'NEXT STEP').click(); // Step 2
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('button', 'NEXT STEP').click(); // Step 3
    cy.contains('button', 'NEXT STEP').click(); // Step 4
    cy.contains('button', 'NEXT STEP').click(); // Step 5
    cy.contains('button', 'NEXT STEP').click(); // Step 6

    cy.contains('button', 'NEXT STEP').click(); // Step 7
    cy.contains('button', 'NEXT STEP').click(); // Step 8
    cy.contains('button', 'SUBMIT QUOTE').click();

    // 2. Verify Quote submission success
    cy.contains('Configurator Quote Submitted!').should('be.visible');

    // 3. Admin: Open Quotes Desk & Approve Quote
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/quotes');
    cy.contains('Loading quotes...').should('not.exist');
    cy.get('tbody tr').first().find('td').eq(1).click();
    cy.get('[data-cy="admin-view-quote-btn"]').first().click();
    cy.contains('APPROVE').first().click();
    cy.contains(/approved/i).should('be.visible');

    // 4. Admin: Click CONVERT TO ORDER
    cy.contains('CONVERT TO ORDER').first().click();

    // 5. Verify navigation to Admin Orders Pipeline and order record presence
    cy.url().should('include', '/dashboard/orders');
    cy.contains('h1', 'Orders').should('be.visible');
    cy.contains('ORD-').should('be.visible');

    // 6. Customer: Open Client Workspace My Orders page
    cy.clearLocalStorage();
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/orders');
    cy.contains('My Orders').should('be.visible');
    cy.contains('ORD-').should('be.visible');

    // 7. Verify PostgreSQL persistence across browser refreshes
    cy.reload();
    cy.contains('My Orders').should('be.visible');
    cy.contains('ORD-').should('be.visible');
  });
});
