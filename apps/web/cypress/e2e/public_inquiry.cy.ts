describe('Public Inquiry Flow', () => {
  beforeEach(() => {
    cy.visit('/get-quote');
  });

  it('submits a guest inquiry successfully', () => {
    cy.get('input[placeholder="Acme Tech Pvt Ltd"]').type('Test Guest Company');
    cy.get('input[placeholder="Rahul Mishra"]').type('Guest User');
    cy.get('input[placeholder="+91 98765 43210"]').type('9998887776');
    
    // Select category
    cy.get('select').first().select('Cotton Caps');
    
    // Quantity
    cy.get('input[type="number"]').clear().type('150');
    
    // Message
    cy.get('textarea').type('E2E Test Guest Inquiry Message');
    
    cy.intercept('POST', '**/api/v1/inquiries').as('postInquiry');
    // Submit
    cy.get('button[type="submit"]').click();
    
    cy.wait('@postInquiry', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });
    
    // Verify success
    cy.contains('Inquiry Submitted!', { timeout: 10000 }).should('be.visible');
    cy.contains('Inquiry Number').should('be.visible');
    cy.contains(/INQ-\d{4}-\d{4}/).should('be.visible');
  });
});
