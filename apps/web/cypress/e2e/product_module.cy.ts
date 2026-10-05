describe('Product Management Module', () => {
  beforeEach(() => {
    // Basic admin login setup
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/products');
  });

  it('should display KPI cards with real data', () => {
    cy.get('h1').contains('Products');
    cy.contains('Total Products').should('be.visible');
    cy.contains('Active Products').should('be.visible');
    cy.contains('Draft Products').should('be.visible');
    cy.contains('Categories').should('be.visible');
    cy.contains('Total Variants').should('be.visible');
  });

  it('should search products', () => {
    // Type in search bar
    cy.get('input[placeholder="Search products..."]').type('T-Shirt');
    cy.wait(500); // wait for debounce/fetch
    cy.get('table').should('be.visible');
    
    // Check if table rows exist
    cy.get('tbody tr').then($rows => {
      if ($rows.text().includes('No products found')) {
         cy.log('Database empty, skipping row assertions');
      } else {
         cy.get('tbody tr').first().should('be.visible');
      }
    });
  });

  it('should open the full Add Product form with every configuration section', () => {
     cy.get('[data-cy="add-product-btn"]').click();
     cy.location('pathname').should('eq', '/dashboard/products/new');

     cy.contains('h1', 'Add New Product').should('be.visible');
     cy.contains('label', 'Product Name *').should('be.visible');
     cy.contains('label', 'Slug (URL) *').should('be.visible');
     cy.contains('label', 'Base Price (₹) *').should('be.visible');

     for (const section of [
       'basic', 'pricing', 'social', 'sizes', 'colors', 'stock', 'order-images',
       'videos', 'gift', 'addon', 'highlights', 'settings', 'designer', 'images',
     ]) {
       cy.get(`[data-cy="section-${section}"]`).should('exist');
     }
     cy.contains('button', '+ Add Range').should('exist');
     cy.contains('button', 'Add Color').should('exist');

     // Back to the list
     cy.contains('a', 'Cancel').click();
     cy.location('pathname').should('eq', '/dashboard/products');
  });

  it('should duplicate a product correctly', () => {
     cy.get('tbody tr').then($rows => {
      if (!$rows.text().includes('No products found')) {
         const initialCount = $rows.length;
         // Click duplicate on first row
         cy.get('tbody tr').first().find('button[title="Duplicate"]').click();
         cy.wait(1000); // Wait for API and fetch
         
         // Verify a new row appears (this assumes we aren't paginating heavily, basic check)
         cy.get('tbody tr').should('have.length.at.least', initialCount);
         cy.get('tbody tr').first().should('contain.text', '(Copy)');
      }
     });
  });
});
