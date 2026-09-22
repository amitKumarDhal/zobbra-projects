describe('ZOBBRA Customizer — Clean Identity & Empty Slate Verification', () => {
  it('should load customizer with empty canvas, zero dummy text/artwork, and neutral guest header', () => {
    // Visit apparel product customizer directly (Polo / T-Shirt)
    cy.visit('/products/classic-corporate-polo-tshirt/customize');

      cy.url().should('include', '/customize');
      cy.wait(1000);

      // 1. Verify NO dummy text or dummy artwork is pre-populated
      cy.contains('YOUR TEXT').should('not.exist');
      cy.contains('YOUR LOGO').should('not.exist');

      // 2. Verify empty state UI guide is displayed
      cy.contains('Add your logo, text or artwork').should('be.visible');

      // 3. Verify neutral header for guests (NO "Signed in as..." banner)
      cy.contains('Signed in as').should('not.exist');
      cy.contains('Amit Kumar Dhal').should('not.exist');

      // 4. Verify 3-panel architecture
      // Left tool panel tabs
      cy.contains('button', 'Colors').should('be.visible');
      cy.contains('button', 'Logo').should('be.visible');
      cy.contains('button', 'Text').should('be.visible');

      // Verify Body and Collar Color options
      cy.contains('BODY COLOR').should('be.visible');
      cy.contains('COLLAR & RIB COLOR').should('be.visible');

      // Right order panel
      cy.contains('Total Quantity').should('be.visible');
      cy.contains('Total Estimate').should('be.visible');
      cy.contains('button', 'Proceed').should('be.visible');

      // 5. Test adding custom text via input
      cy.contains('button', 'Text').click();
      cy.get('input[placeholder="Enter brand or text..."]').type('ZOBBRA TEST TEXT');
      cy.contains('button', '+ Add Text to Garment').click();

      // Empty state guideline disappears once object is added
      cy.contains('Add your logo, text or artwork').should('not.exist');
  });
});
