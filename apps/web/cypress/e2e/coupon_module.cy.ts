describe('Coupon Module', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/coupons');
  });

  it('should render the Coupons dashboard and KPI cards', () => {
    cy.get('h1').contains('Coupons').should('be.visible');
    
    // Check KPI Cards
    cy.contains('Total Coupons').should('be.visible');
    cy.contains('Active Coupons').should('be.visible');
    cy.contains('Inactive Coupons').should('be.visible');
    cy.contains('Expired Coupons').should('be.visible');
    cy.contains('Total Usage').should('be.visible');
  });

  it('should open the Add New Coupon drawer and close it', () => {
    cy.contains('button', 'Add New Coupon').click();
    cy.contains('h2', 'Add New Coupon').should('be.visible');
    
    // Cancel
    cy.contains('button', 'Cancel').click();
    cy.contains('h2', 'Add New Coupon').should('not.exist');
  });

  it('should support searching and filtering', () => {
    cy.get('input[placeholder="Search coupons by code or name..."]').type('WELCOME');
    cy.wait(500); // debounce wait
    cy.get('select').first().select('Active');
    cy.wait(500);
    cy.get('table').should('be.visible');
  });
  
  it('should enforce required fields in the drawer', () => {
     cy.contains('button', 'Add New Coupon').click();
     
     // Only fill name, not code
     cy.get('input[name="name"]').type('Test Discount');
     
     // Submit form
     cy.contains('button', 'Save Coupon').click();
     
     // Browser HTML5 validation should prevent submission, or API returns error
     cy.get('input[name="code"]:invalid').should('have.length', 1);
  });
});
