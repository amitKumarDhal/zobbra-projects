describe('ZOBBRA Cap Customizer — Dedicated Headwear Silhouette & Free-Size Verification', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('should load cap customizer with 6-panel cap silhouette, Crown/Visor color controls, and Free Size handling', () => {
    // 1. Visit the cap product customizer directly
    cy.visit('/products/classic-promotional-cotton-cap/customize');
    cy.wait(2000);

    // Verify Product Header and Headwear Category
    cy.contains('Classic Promotional Structured Cotton Cap').should('be.visible');
    cy.contains(/EMBROIDERY AREA|PRINTABLE AREA/i).should('not.exist');

    // 2. Verify Cap Specific Color Controls
    cy.get('#tab-tool-colors').click();
    cy.contains('CROWN COLOR').should('be.visible');
    cy.contains('VISOR / BRIM COLOR').should('be.visible');
    cy.contains('BODY COLOR').should('not.exist');

    // 3. No quantity/size UI in the customizer (Free Size is applied to the submitted variant)
    cy.contains('One size').should('not.exist');

    // 4. Verify Cap Vector Silhouette is rendered
    cy.get('svg[viewBox="0 0 500 580"]').within(() => {
      // Eyelet circles or squatchee button
      cy.get('circle').should('have.length.at.least', 4);
    });

    // 5. Test FRONT / BACK switcher
    cy.contains('button', 'Back').click();
    cy.wait(500);
    // Rear view should display rear strap and brass buckle elements
    cy.get('svg').should('be.visible');

    // Switch back to FRONT
    cy.contains('button', 'Front').click();
    cy.wait(500);

    // 6. Test Text Tool for Cap
    cy.get('#tab-tool-text').click();
    cy.contains('button', '+ Add Text to Cap').should('be.visible');
    cy.get('input[placeholder="Enter brand or text..."]').type('ACME CAP');
    cy.contains('button', '+ Add Text to Cap').click();

    // 7. Verify empty guide disappears
    cy.contains('use tools to add').should('not.exist');
  });
});
