describe('ZOBBRA Cap Customizer — Dedicated Headwear Silhouette & Free-Size Verification', () => {
  it('should load cap customizer with 6-panel cap silhouette, Crown/Visor color controls, and Free Size handling', () => {
    // 1. Visit the cap product customizer directly
    cy.visit('/products/classic-promotional-cotton-cap/customize');
    cy.wait(2000);

    // Verify Product Header and Headwear Category
    cy.contains('Classic Promotional Structured Cotton Cap').should('be.visible');
    cy.contains('Embroidery Area: 10cm × 5.5cm (Front Crown)').should('be.visible');

    // 2. Verify Cap Specific Color Controls
    cy.contains('CROWN COLOR').should('be.visible');
    cy.contains('VISOR / BRIM COLOR').should('be.visible');
    cy.contains('BODY COLOR').should('not.exist');

    // 3. Verify Free Size One-Size-Fits-All Badge
    cy.contains('Standard Free Size (One Size Fits All)').should('be.visible');
    cy.contains('Structured 6-panel fit with adjustable rear fabric strap').should('be.visible');

    // 4. Verify Cap Vector Silhouette is rendered
    cy.get('svg[viewBox="0 0 500 580"]').within(() => {
      // Eyelet circles or squatchee button
      cy.get('circle').should('have.length.at.least', 4);
    });

    // 5. Test FRONT / BACK switcher
    cy.contains('button', 'BACK').click();
    cy.wait(500);
    // Rear view should display rear strap and brass buckle elements
    cy.get('svg').should('be.visible');

    // Switch back to FRONT
    cy.contains('button', 'FRONT').click();
    cy.wait(500);

    // 6. Test Text Tool for Cap
    cy.contains('button', 'Text').click();
    cy.contains('button', '+ Add Text to Cap').should('be.visible');
    cy.get('input[placeholder="Enter brand or text..."]').type('ACME CAP');
    cy.contains('button', '+ Add Text to Cap').click();

    // 7. Verify empty guide disappears
    cy.contains('Add your logo or text').should('not.exist');
  });
});
