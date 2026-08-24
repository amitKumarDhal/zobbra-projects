describe('Admin Create Quote Flow', () => {
  beforeEach(() => {
    // Reset database to a known state using the seed endpoint if available,
    // or just rely on existing test data.
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.get('aside', { timeout: 8000 }).should('be.visible');
  });

  it('navigates to create quote and loads correctly without Quote Not Found', () => {
    // Attempt direct navigation to the new route
    cy.visit('/dashboard/quotes/new');
    cy.url().should('include', '/dashboard/quotes/new');
    
    // Ensure "Quote Not Found" doesn't exist
    cy.contains('Quote Not Found').should('not.exist');
    
    // Verify header exists
    cy.contains('Create New Quote').should('exist');
  });

  it('selects a customer, adds a product, calculates pricing, and saves draft', () => {
    // Intercept to provide deterministic data
    cy.intercept('GET', '**/api/v1/customers*', {
      statusCode: 200,
      body: { success: true, data: [{ id: 'cust_1', name: 'Test Customer', email: 'test@customer.com', phone: '1234567890' }] }
    }).as('getCustomers');
    
    cy.intercept('GET', '**/api/v1/products*', {
      statusCode: 200,
      body: { success: true, data: [{ id: 'prod_1', name: 'Test Product', basePrice: 200, variants: [] }] }
    }).as('getProducts');

    cy.intercept('POST', '**/api/v1/quotes/calculate', {
      statusCode: 200,
      body: { 
        success: true, 
        data: {
          subtotal: 30000,
          gstTotal: 1500,
          totalAmount: 31500,
          items: [{ unitPrice: 200, totalPrice: 30000 }]
        }
      }
    }).as('calculatePricing');
    
    cy.intercept('POST', '**/api/v1/quotes', {
      statusCode: 200,
      body: { success: true, quote: { id: 'test_quote_id' } }
    }).as('createQuote');

    cy.visit('/dashboard/quotes/new');
    
    // Wait for data to load
    cy.wait(['@getCustomers', '@getProducts']);
    
    // Select customer (assuming the first option after placeholder is valid)
    cy.get('select').first().select('cust_1');

    // Click Add Item
    cy.contains('Add Item').click();
    
    // Wait for calculating to finish
    cy.contains('Calculating...').should('not.exist');

    // Change quantity to trigger a pricing recalculation
    cy.get('input[type="number"]').clear().type('150');
    
    // Wait for the UI to update the Grand Total
    cy.contains('Grand Total').should('exist');
    cy.contains('₹0').should('not.exist'); // Means calculation worked
    
    // Click Save Draft
    cy.contains('Save as Draft').click();
    
    // Should navigate to quote detail
    cy.url().should('include', '/dashboard/quotes/');
    cy.url().should('not.include', '/new');
  });
});
