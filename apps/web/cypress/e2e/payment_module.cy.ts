describe('Payments Module', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/payments');
  });

  it('should render the Payments dashboard and KPI cards', () => {
    cy.get('h1').contains('Payments').should('be.visible');
    
    // Check KPI Cards
    cy.contains('Total Collection').should('be.visible');
    cy.contains('Received').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('Overdue').should('be.visible');
    cy.contains('Refunded').should('be.visible');
  });

  it('should support searching and filtering', () => {
    cy.get('input[placeholder="Search by order no., invoice no., customer..."]').type('ORD-2024');
    cy.wait(500); // debounce wait
    cy.get('select').first().select('Paid');
    cy.wait(500);
    cy.get('table').should('be.visible');
  });

  it('should render the Right Sidebar components', () => {
    cy.contains('h3', 'Payment Overview').should('be.visible');
    cy.contains('h3', 'Payment Methods').should('be.visible');
    cy.contains('h3', 'Overdue Invoices').should('be.visible');
    cy.contains('h3', 'Quick Actions').should('be.visible');
  });

  it('should open and close the Record Payment modal', () => {
    cy.contains('button', 'RecordPayment').click();
    cy.contains('h2', 'Record Manual Payment').should('be.visible');
    
    // Cancel
    cy.contains('button', 'Cancel').click();
    cy.contains('h2', 'Record Manual Payment').should('not.exist');
  });
  
  it('should enforce amount validation on manual payment record', () => {
     // Note: In a real DB test, we'd mock the network response. 
     // Here we just test the frontend UI state triggers.
     cy.contains('button', 'RecordPayment').click();
     
     cy.get('input[placeholder="e.g. ord_..."]').type('fake_ord_id');
     cy.get('input[placeholder="0.00"]').type('500');
     
     // Submit form
     cy.contains('button', 'Record Payment').click();
     
     // API will return 404 because fake_ord_id does not exist, check for error message
     cy.contains('Order not found').should('be.visible');
  });
});
