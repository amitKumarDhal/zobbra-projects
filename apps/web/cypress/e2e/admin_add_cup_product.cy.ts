describe('ZOBBRA Admin & Customer — Cup / Mug Product Feature Verification', () => {
  it('should display Classic Corporate Ceramic Coffee Mug in customer catalog and support drinkware category filtering', () => {
    // 1. Visit public customer catalog
    cy.visit('/products');
    cy.wait(1500);

    // Verify Classic Corporate Ceramic Coffee Mug appears in the catalog
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');
    cy.contains('₹149').should('be.visible');

    // 2. Filter by "Mugs & Bottles"
    cy.contains('button', 'Mugs & Bottles').click();
    cy.wait(1000);
    cy.url().should('include', 'category=drinkware');
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');

    // 3. Click DETAILS button on the mug card
    cy.contains('button', 'DETAILS').click();
    cy.url().should('include', '/products/');
    cy.wait(1500);

    // Verify title, price, and specs description
    cy.contains('Classic Corporate Ceramic Coffee Mug').should('be.visible');
    cy.contains('330 ml').should('be.visible');
    cy.contains('Grade-A Ceramic Stoneware').should('be.visible');
    cy.contains('Microwave Safe & Dishwasher Safe').should('be.visible');
    cy.contains('₹149').should('be.visible');
  });

  it('should render 1-click Cup / Mug preset in Admin Add Product page and auto-fill specifications', () => {
    // Log in as Admin using 1-click dev access
    cy.visit('/login');
    cy.wait(1000);
    cy.contains('button', 'Admin').click();
    cy.contains('button', 'SIGN IN').click();
    cy.wait(1500);

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

  it('should support 1-click Cup / Mug template inside the Admin Products Drawer', () => {
    // Log in as Admin using 1-click dev access
    cy.visit('/login');
    cy.wait(1000);
    cy.contains('button', 'Admin').click();
    cy.contains('button', 'SIGN IN').click();
    cy.wait(1500);

    // Visit Dashboard Products
    cy.visit('/dashboard/products');
    cy.wait(1500);

    // Open drawer
    cy.contains('button', 'Add New Product').should('be.visible').click();
    cy.wait(800);

    // Click Cup / Mug template in drawer
    cy.contains('button', 'Cup / Mug').should('be.visible').click();

    // Verify inputs populated
    cy.get('input[placeholder*="Classic Promotional Structured Cotton Cap"]').should('have.value', 'Classic Corporate Ceramic Coffee Mug');
    cy.get('input[placeholder*="classic-cotton-cap"]').should('have.value', 'classic-corporate-ceramic-mug');
    cy.contains('Cup / Mug Mode:').should('be.visible');
    cy.get('textarea').should('contain.value', '330ml (11oz) matte-finish ceramic coffee mug');
  });
});
