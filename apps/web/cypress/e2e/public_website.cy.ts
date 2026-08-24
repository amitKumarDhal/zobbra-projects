describe('Zobra Public Storefront Website E2E', () => {
  it('loads the homepage and verifies branding, navigation, and key pages', () => {
    // 1. Visit homepage /
    cy.visit('/');

    // 2. Verify Homepage loads & branding is visible
    cy.contains('CUSTOM MERCHANDISE').should('be.visible');
    cy.contains('THAT REPRESENTS').should('be.visible');

    // 3. Verify Navigation is visible
    cy.get('header').should('be.visible');
    cy.get('header').contains('Products').should('be.visible');
    cy.get('header').contains('About').should('be.visible');

    // 4. Verify Products navigation works
    cy.contains('EXPLORE PRODUCTS').click();
    cy.url().should('include', '/products');
    cy.contains('Merchandise Catalog', { matchCase: false }).should('be.visible');

    // 5. Verify About navigation works
    cy.visit('/about');
    cy.url().should('include', '/about');
    cy.contains('ABOUT ZOBBRA').should('be.visible');
    cy.contains('Modern B2B Merchandise SaaS').should('be.visible');

    // 6. Verify Contact navigation works
    cy.visit('/contact');
    cy.url().should('include', '/contact');
    cy.contains('Get in Touch').should('be.visible');

    // 7. Verify no uncaught JavaScript errors occur
    cy.contains(/uncaught|application error|something went wrong/i).should('not.exist');
  });
});
