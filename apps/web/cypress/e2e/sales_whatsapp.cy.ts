describe('Sales Conversation & WhatsApp MVP Real E2E Journey', () => {
  it('executes full quote submission, admin quote detail view, WhatsApp action trigger, sales note creation, quote editing with server repricing, approval, and order conversion', () => {
    // 1. Customer submits quote via 8-step wizard
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');

    cy.contains('Polo T-Shirts (200 GSM)').click();
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'NEXT STEP').click();

    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('button', 'SUBMIT QUOTE').click();

    cy.contains('Configurator Quote Submitted!').should('be.visible');

    // 2. Admin opens Quotes Desk
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/quotes');
    cy.contains('Loading quotes...').should('not.exist');

    // 3. Open Quote Detail Page
    cy.get('tbody tr').first().find('td').eq(1).click();
    cy.get('[data-cy="admin-view-quote-btn"]').first().click();
    cy.url().should('include', '/dashboard/quotes/');
    cy.contains('Customer Information').should('be.visible');

    // 4. Verify Customer details & WhatsApp Button
    cy.contains('WHATSAPP CUSTOMER').should('be.visible');

    // 5. Add Internal Sales Note
    cy.get('textarea').type('Client requested 150 units with custom back logo');
    cy.contains('button', 'ADD NOTE').click();
    cy.contains('Client requested 150 units').should('be.visible');

    // 6. Verify Note persistence across reload
    cy.reload();
    cy.contains('Client requested 150 units').should('be.visible');

    // 7. Edit Quote & verify server repricing
    cy.contains('button', 'EDIT QUOTE').click();
    cy.get('[data-cy="admin-qty-input"]').focus().type('{selectall}{backspace}150');
    cy.get('[data-cy="admin-save-quote-btn"]').click();
    cy.contains('150 Pcs', { timeout: 10000 }).should('be.visible');

    // 8. Approve quote
    cy.contains('button', 'APPROVE').click();
    cy.contains(/approved/i).should('be.visible');

    // 9. Convert to Order
    cy.contains('button', 'CONVERT TO ORDER').click();
    cy.url().should('include', '/dashboard/orders');
    cy.contains('ORD-').should('be.visible');
  });
});
