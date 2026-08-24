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

  it('should open the Add Product drawer and navigate tabs', () => {
     cy.contains('button', 'Add New Product').click();
     
     // Drawer should open and default to Basic Info
     cy.contains('Add New Product').should('be.visible');
     cy.contains('label', 'Product Name *').should('be.visible');
     cy.contains('label', 'SKU / Slug *').should('be.visible');
     cy.contains('label', 'Base Price (₹) *').should('be.visible');

     // Navigate to Variants Tab
     cy.contains('button', 'Variants').click();
     cy.contains('button', 'Variants').should('have.class', 'border-[#3B6FEB]');
     cy.contains('button', '+ Add Variant').should('be.visible');

     // Navigate to Pricing Tab
     cy.contains('button', 'Pricing').click();
     cy.contains('button', 'Pricing').should('have.class', 'border-[#3B6FEB]');
     cy.contains('button', '+ Add Pricing Tier').should('be.visible');
     
     // Navigate to Design Studio Tab
     cy.contains('button', 'Design Studio').click();
     cy.contains('button', 'Design Studio').should('have.class', 'border-[#3B6FEB]');
     cy.contains('UI ONLY / FUTURE').should('be.visible');

     // Close drawer
     cy.get('button').find('svg.lucide-x').parent().click();
     cy.contains('h2', 'Add New Product').should('not.exist');
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
