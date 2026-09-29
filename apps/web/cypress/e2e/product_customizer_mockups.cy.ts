describe('ZOBBRA Product-Specific Customizer Mockup Verification', () => {
  it('1. T-Shirt / Polo Customizer: shows Polo mockup, chest print area, and garment color controls', () => {
    cy.visit('/products/classic-corporate-polo-tshirt/customize');
    cy.wait(1500);

    // Header and Apparel category
    cy.contains('Classic Corporate Pique Polo T-Shirt').should('be.visible');
    cy.contains('Print Area: 30cm × 40cm').should('be.visible');

    // Color controls
    cy.contains('BODY COLOR').should('be.visible');
    cy.contains('COLLAR & RIB COLOR').should('be.visible');
    cy.contains('CROWN COLOR').should('not.exist');

    // Vector SVG silhouette check - Polo placket/buttons
    cy.get('svg[viewBox="0 0 500 580"]').within(() => {
      // Sleeve lines, placket, collar
      cy.get('path').should('have.length.at.least', 5);
    });

    // Text tool
    cy.contains('button', 'Text').click();
    cy.contains('button', '+ Add Text to Garment').should('be.visible');
  });

  it('2. Cap Customizer: shows 6-panel cap silhouette, crown/visor color controls, and embroidery area', () => {
    cy.visit('/products/classic-promotional-cotton-cap/customize');
    cy.wait(1500);

    // Header and Cap category
    cy.contains('Classic Promotional Structured Cotton Cap').should('be.visible');
    cy.contains('Embroidery Area: 10cm × 5.5cm (Front Crown)').should('be.visible');

    // Color controls
    cy.contains('CROWN COLOR').should('be.visible');
    cy.contains('VISOR / BRIM COLOR').should('be.visible');
    cy.contains('BODY COLOR').should('not.exist');

    // Vector SVG silhouette check - Cap eyelets/crown
    cy.get('svg[viewBox="0 0 500 580"]').within(() => {
      cy.get('circle').should('have.length.at.least', 4);
    });

    // Text tool
    cy.contains('button', 'Text').click();
    cy.contains('button', '+ Add Text to Cap').should('be.visible');
  });

  it('3. Mug Customizer: shows 3D Ceramic Mug mockup, mug color controls, and reversible handle', () => {
    cy.visit('/products/classic-corporate-ceramic-mug/customize');
    cy.wait(1500);

    // Header
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');
    cy.contains('Print Area: 8.5cm × 7.5cm (Front View)').should('be.visible');

    // Color controls
    cy.contains('MUG COLOR').should('be.visible');
    cy.contains('HANDLE & INNER COLOR').should('be.visible');
    cy.contains('CROWN COLOR').should('not.exist');

    // Mug Vector Silhouette
    cy.get('svg[viewBox="0 0 500 580"]').should('be.visible');

    // Text tool
    cy.contains('button', 'Text').click();
    cy.contains('button', '+ Add Text to Mug').should('be.visible');

    // Switch to BACK / REVERSE view
    cy.contains('button', 'BACK').click();
    cy.wait(500);
    cy.contains('Print Area: 8.5cm × 7.5cm (Reverse View)').should('be.visible');
  });

  it('4. Bag Customizer: shows Laptop Backpack mockup, front branding panel, and rear padded straps', () => {
    cy.visit('/products/executive-corporate-laptop-backpack/customize');
    cy.wait(1500);

    // Header
    cy.contains('Executive Corporate Laptop Backpack').should('be.visible');
    cy.contains('Branding Area: 12cm × 10cm (Front Panel)').should('be.visible');

    // Color controls
    cy.contains('BAG COLOR').should('be.visible');
    cy.contains('TRIM & ACCENTS').should('be.visible');
    cy.contains('CROWN COLOR').should('not.exist');

    // Backpack Vector Silhouette
    cy.get('svg[viewBox="0 0 500 580"]').should('be.visible');

    // Text tool
    cy.contains('button', 'Text').click();
    cy.contains('button', '+ Add Text to Bag').should('be.visible');

    // Switch to BACK view
    cy.contains('button', 'BACK').click();
    cy.wait(500);
    cy.get('svg[viewBox="0 0 500 580"]').should('be.visible');
  });
});
