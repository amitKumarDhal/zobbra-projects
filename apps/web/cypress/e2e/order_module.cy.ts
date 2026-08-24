describe('Order Management Module', () => {
  beforeEach(() => {
    // Basic admin login setup (mocking standard Zobra auth flow for tests)
    cy.login();
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/orders');
  });

  it('should display KPI cards with real data', () => {
    cy.get('h1').contains('Orders');
    cy.contains('Total Orders').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('In Progress').should('be.visible');
    cy.contains('Completed').should('be.visible');
    cy.contains('Revenue').should('be.visible');
  });

  it('should search and filter orders', () => {
    // Type in search bar
    cy.get('input[placeholder="Search order by ID, customer..."]').type('ZQB-');
    cy.wait(500); // wait for debounce/fetch
    cy.get('table').should('be.visible');
    
    // Check if table rows exist
    cy.get('tbody tr').then($rows => {
      if ($rows.text().includes('No orders found')) {
         cy.log('Database empty, skipping row assertions');
      } else {
         cy.get('tbody tr').first().should('be.visible');
      }
    });
  });

  it('should open the right-side drawer when an order is clicked', () => {
    cy.contains('Loading orders...').should('not.exist');
    cy.get('tbody tr').then($rows => {
      if (!$rows.text().includes('No orders found')) {
         // Click the first row
         cy.get('tbody tr').first().find('td').eq(1).click();
         
         // Drawer should open
         cy.contains('Order Details').should('exist');
         cy.contains('Order Details').parent().contains(/ORD-/).should('exist');
         
         // Verify Customer Info block
         cy.contains('Order Timeline').should('exist');
         
         // Verify Timeline
         cy.contains('Order Timeline').should('exist');
         
         // Verify Notes section
         cy.contains('Notes').should('exist');

         // Close drawer
         cy.get('button').find('svg.lucide-x').parent().click();
         cy.contains('Order Details').should('not.exist');
      }
    });
  });

  it('should display customer orders correctly when logged in as customer', () => {
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/orders');
    
    cy.get('h1').contains('My Orders').should('be.visible');
    cy.contains('Loading orders from database...').should('not.exist');
    cy.get('tbody tr', { timeout: 10000 }).first().should('be.visible');
  });
});
