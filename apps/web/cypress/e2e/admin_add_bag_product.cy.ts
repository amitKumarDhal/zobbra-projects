describe('ZOBBRA Admin & Customer — Bag Product Feature Verification', () => {
  it('should display Executive Corporate Laptop Backpack in customer catalog and support category filtering', () => {
    // 1. Visit public customer catalog
    cy.visit('/products');
    cy.wait(1500);

    // Verify Executive Corporate Laptop Backpack appears in the catalog
    cy.contains('Executive Corporate Laptop Backpack').should('be.visible');
    cy.contains('₹499').should('be.visible'); // starting price = lowest quantity-range price

    // 2. Filter by "Bags & Backpacks"
    cy.contains('button', 'Bags & Backpacks').click();
    cy.wait(1000);
    cy.url().should('include', 'category=bags');
    cy.contains('Executive Corporate Laptop Backpack').should('be.visible');

    // 3. The card shows the price and opens straight in the customizer (no separate product page)
    cy.contains('₹699').should('be.visible');
    cy.contains('button', 'CUSTOMIZE').click();
    cy.url().should('match', /\/products\/[^/]+\/customize/);
    cy.contains('h1', 'Executive Corporate Laptop Backpack', { timeout: 20000 }).should('be.visible');
  });

  it('should render 1-click Bag preset in Admin Add Product page and auto-fill specifications', () => {
    // Admin session (the login page no longer has the 1-click dev access buttons)
    cy.login();

    // Visit Add Product page
    cy.visit('/dashboard/products/new');
    cy.wait(1500);

    // 1. Verify "🎒 Backpack / Bag" preset button exists and click it
    cy.contains('button', 'Backpack / Bag').should('be.visible').click();

    // 2. Verify auto-filled inputs
    cy.get('input[placeholder*="Classic Promotional"]').should('have.value', 'Executive Corporate Laptop Backpack');
    cy.get('input[placeholder*="classic-cotton-cap"]').should('have.value', 'executive-corporate-laptop-backpack');
    cy.get('input[type="number"]').first().should('have.value', '699');

    // 3. Verify Bag Mode banner and description template
    cy.contains('🎒 Bag / Backpack Mode Active').should('be.visible');
    cy.contains('Insert Bag Specs Template').should('be.visible');
    cy.get('textarea').should('contain.value', '900D Heavy-Duty Water-Repellent Ballistic Polyester');
  });
});
