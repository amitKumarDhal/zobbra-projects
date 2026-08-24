describe('Phase 1 — Product Experience E2E', () => {
  it('tests product catalog search, category filtering, and product detail page interaction', () => {
    // 1. Visit /products catalog
    cy.visit('/products');
    cy.url().should('include', '/products');
    cy.contains('Custom Merchandise Catalog').should('be.visible');

    // 2. Verify Product cards exist - wait for debounce + API fetch, then search for specific products
    // Products load after 300ms debounce - wait for ANY product to appear first
    cy.get('[data-cy^="product-card"], .product-card, h3', { timeout: 10000 }).should('exist');
    
    // Search for Polo specifically to ensure it exists in catalog
    cy.get('input[placeholder*="Search merchandise"]').type('Polo');
    cy.contains('Premium Polo T-Shirt', { timeout: 8000 }).should('be.visible');

    // 3. Search functionality works — clear and search Backpack
    cy.get('input[placeholder*="Search merchandise"]').clear();
    cy.get('input[placeholder*="Search merchandise"]').type('Backpack');
    cy.contains('Executive Backpack', { timeout: 8000 }).should('be.visible');
    cy.contains('Premium Polo T-Shirt').should('not.exist');

    // Clear search
    cy.get('input[placeholder*="Search merchandise"]').clear();
    // Wait for products to reload after clearing
    cy.wait(500);

    // 4. Category filtering works
    cy.contains('button', 'Caps & Headwear').click();
    cy.contains('Promotional Cotton Cap with Embroidery', { timeout: 8000 }).should('be.visible');
    cy.contains('Premium Polo T-Shirt').should('not.exist');

    cy.contains('button', 'ALL').click();
    // Wait for all products to reload
    cy.wait(500);

    // 5. Navigate to Product Detail page
    cy.visit('/products/polo-200gsm');
    cy.url().should('include', '/products/polo-200gsm');

    // 6. Verify Product information & Specs
    cy.contains('Premium Polo T-Shirt').should('be.visible');
    cy.contains('200 GSM').should('be.visible');

    // 7. Verify Color & Size selection
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('Color: Charcoal Black').should('be.visible');
    cy.contains('button', 'XL').click();

    // 8. Verify live estimate calculation updates
    cy.contains('Live Estimate').should('be.visible');

    // 9. Verify Start Quote CTA works
    cy.contains('button', 'START QUOTE CONFIGURATOR').should('be.visible');
  });
});
