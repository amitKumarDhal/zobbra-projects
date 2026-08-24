describe('Real Backend Quote Persistence Journey E2E', () => {
  it('executes full quote creation, backend persistence, customer retrieval, admin management, and status updates', () => {
    // 1. Visit 8-step quote configurator as Customer
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.contains('8-Step Merchandise Configurator').should('be.visible');

    // Step 1: Product selection
    cy.contains('Polo T-Shirts (200 GSM)').click();
    cy.contains('button', 'NEXT STEP').click();

    // Step 2: Color selection
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('button', 'NEXT STEP').click();

    // Step 3: Fabric selection
    cy.contains('button', 'NEXT STEP').click();

    // Step 4: Size Breakdown
    cy.contains('button', 'NEXT STEP').click();

    // Step 5: Print Position
    cy.contains('button', 'NEXT STEP').click();

    // Step 6: Artwork Attachment

    cy.contains('button', 'NEXT STEP').click();

    // Step 7: Summary Preview
    cy.contains('button', 'NEXT STEP').click();

    // Step 8: Address & Delivery
    cy.contains('button', 'SUBMIT QUOTE').click();

    // 2. Verify Quote Submission success and persistent Quote ID
    cy.contains('Configurator Quote Submitted!').should('be.visible');
    cy.contains('ZQB-QT-').should('be.visible');

    // 3. Visit Customer Portal My Quotes page
    cy.visit('/customer/quotes');
    cy.contains('My Quotations').should('be.visible');
    cy.contains('ZQB-').should('be.visible');

    // 4. Reload browser to verify PostgreSQL persistence across refreshes
    cy.reload();
    cy.contains('My Quotations').should('be.visible');
    cy.contains('ZQB-').should('be.visible');

    // 5. Visit Admin Dashboard Quotes desk
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/quotes');
    cy.contains('Loading quotes...').should('not.exist');

    // 6. Verify SAME quote appears in Admin Desk
    cy.contains('ZQB-').should('be.visible');
    cy.get('tbody tr').first().find('td').eq(1).click();
    cy.get('[data-cy="admin-view-quote-btn"]').first().click();
    cy.contains('APPROVE').first().click();

    // 7. Verify status change persists back to Customer Portal
    cy.clearLocalStorage();
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/quotes');
    cy.contains(/approved/i).should('be.visible');
  });
});
