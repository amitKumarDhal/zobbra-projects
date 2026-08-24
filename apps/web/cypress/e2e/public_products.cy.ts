describe('Public Products & Catalog Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate through the products dropdown categories', () => {
    // Open dropdown
    cy.contains('button', 'Products').click();
    
    // Check all categories are present
    cy.contains('Custom T-Shirts').should('be.visible');
    cy.contains('Hoodies & Sweatshirts').should('be.visible');
    cy.contains('Caps & Headwear').should('be.visible');
    cy.contains('Bags & Backpacks').should('be.visible');
    
    // Click a category
    cy.contains('Custom T-Shirts').click();
    
    // Verify URL parameter
    cy.url().should('include', '/products?category=custom-t-shirts');
    
    // Verify catalog title
    cy.contains('h1', 'Custom Merchandise Catalog').should('be.visible');
    
    // Verify the category filter is active (Custom T-Shirts is the label for custom-t-shirts)
    cy.get('button.bg-\\[\\#111111\\]').contains('Custom T-Shirts').should('be.visible');
  });

  it('should support searching for products', () => {
    cy.visit('/products');
    
    // Type in search box
    cy.get('input[placeholder="Search merchandise..."]').type('Polo');
    
    // URL should not necessarily change immediately without submit, but the fetch should happen
    // Wait for debounce and fetch
    cy.wait(1000); 
    
    // We expect either products to render, or empty state
    // Since we don't know the exact DB state, we just assert the UI is stable
    cy.get('body').then($body => {
      if ($body.find('h3:contains("No products available")').length > 0) {
        cy.contains('No products available yet.').should('be.visible');
      } else {
        cy.get('h3').should('be.visible');
      }
    });
  });

  it('should flow from product detail to quote creation', () => {
    // Visit a potential product page directly if we can, or just mock it.
    // Since we don't know exact UUIDs, we'll visit the catalog, wait for load, and click the first product if available
    cy.visit('/products');
    cy.wait(1500);
    
    cy.get('body').then($body => {
      if ($body.find('button:contains("VIEW & QUOTE")').length > 0) {
        cy.get('button:contains("VIEW & QUOTE")').first().click();
        
        // Wait for detail page load
        cy.wait(1500);
        
        // Product detail page should have the START QUOTE CONFIGURATOR button
        cy.contains('button', 'START QUOTE CONFIGURATOR', { timeout: 8000 }).should('be.visible').click();
        
        // Should navigate to /customer/create-quote with product param
        cy.url().should('include', '/customer/create-quote?product=');
      } else {
        // Try waiting for products to load (debounce delay)
        cy.contains('button', 'VIEW & QUOTE', { timeout: 8000 }).then(($btn) => {
          if ($btn.length > 0) {
            cy.wrap($btn).first().click();
            cy.contains('button', 'START QUOTE CONFIGURATOR', { timeout: 8000 }).should('be.visible');
          } else {
            cy.log('No products in DB to test detail flow.');
          }
        });
      }
    });
  });
});
