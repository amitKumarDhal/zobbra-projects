describe('Admin Inquiry Module', () => {
  beforeEach(() => {
    // Custom command or login simulation (assuming Admin role)
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/inquiries');
  });

  it('displays inquiries and allows filtering', () => {
    cy.contains('Total Inquiries').should('be.visible');
    cy.contains('Registered').should('be.visible');
    cy.contains('Guests').should('be.visible');

    // Check table loads
    cy.get('table').should('be.visible');
    
    // Filter by Guest
    cy.get('select').eq(1).select('Guest');
    // We expect the guest inquiry to be visible
    cy.contains('Guest User').should('exist');
  });

  it('allows adding a note to an inquiry', () => {
    // Open the first inquiry
    cy.contains('INQ-').first().click();
    
    // Check Drawer opens
    cy.contains('Inquiry Details').should('be.visible');
    
    // Add Note
    const testNote = `Test Note ${Date.now()}`;
    cy.get('[data-cy="inquiry-note-input"]').type(testNote);
    cy.get('[data-cy="add-note-btn"]').click();
    
    // Verify note in timeline
    cy.contains(testNote).should('be.visible');
  });
});
