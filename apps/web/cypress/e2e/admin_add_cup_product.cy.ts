describe('ZOBBRA Admin & Customer — Cup / Mug Product Feature Verification', () => {
  it('should display Classic Corporate Ceramic Coffee Mug in customer catalog and support drinkware category filtering', () => {
    // 1. Visit public customer catalog
    cy.visit('/products');
    cy.wait(1500);

    // Verify Classic Corporate Ceramic Coffee Mug appears in the catalog
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');
    cy.contains('₹79').should('be.visible'); // starting price = lowest quantity-range price

    // 2. Filter by "Mugs & Bottles"
    cy.contains('button', 'Mugs & Bottles').click();
    cy.wait(1000);
    cy.url().should('include', 'category=drinkware');
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');

    // 3. The card shows the price and opens straight in the customizer (no separate product page)
    cy.contains('₹149').should('be.visible');
    cy.contains('button', 'CUSTOMIZE').click();
    cy.url().should('match', /\/products\/[^/]+\/customize/);
    cy.contains('h1', 'Classic Corporate Ceramic Coffee Mug', { timeout: 20000 }).should('be.visible');
  });

  it('should render 1-click Cup / Mug preset in Admin Add Product page and auto-fill specifications', () => {
    // Admin session (the login page no longer has the 1-click dev access buttons)
    cy.login();

    // Visit Add Product page
    cy.visit('/dashboard/products/new');
    cy.wait(1500);

    // 1. Verify "☕ Cup / Mug" preset button exists and click it
    cy.contains('button', 'Cup / Mug').should('be.visible').click();

    // 2. Verify auto-filled inputs
    cy.get('input[placeholder*="Classic Promotional"]').should('have.value', 'Classic Corporate Ceramic Coffee Mug');
    cy.get('input[placeholder*="classic-cotton-cap"]').should('have.value', 'classic-corporate-ceramic-mug');
    cy.get('input[type="number"]').first().should('have.value', '149');

    // 3. Verify Cup / Mug Mode banner and description template
    cy.contains('☕ Cup / Mug Mode Active').should('be.visible');
    cy.contains('Insert Mug Specs Template').should('be.visible');
    cy.get('textarea').should('contain.value', 'Grade-A Ceramic Stoneware');
  });

  it('should support the 1-click Cup / Mug preset from the Add New Product button on the Products list', () => {
    // Admin session (the login page no longer has the 1-click dev access buttons)
    cy.login();

    // Visit Dashboard Products
    cy.visit('/dashboard/products');
    cy.wait(1500);

    // "Add New Product" opens the full product form
    cy.contains('a', 'Add New Product').should('be.visible').click();
    cy.location('pathname').should('eq', '/dashboard/products/new');

    // Click Cup / Mug preset
    cy.contains('button', 'Cup / Mug').should('be.visible').click();

    // Verify inputs populated
    cy.get('input[placeholder*="Classic Promotional Structured Cotton Cap"]').should('have.value', 'Classic Corporate Ceramic Coffee Mug');
    cy.get('input[placeholder*="classic-cotton-cap"]').should('have.value', 'classic-corporate-ceramic-mug');
    cy.contains('Cup / Mug Mode Active').should('be.visible');
    cy.get('textarea').should('contain.value', '330ml (11oz) matte-finish ceramic coffee mug');
  });
});
