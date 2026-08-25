describe('Inquiry to Quote Conversion', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/inquiries');
  });

  it('converts an inquiry to a quote', () => {
    // Open the first new inquiry (assuming one exists from previous test)
    cy.contains('INQ-').first().click();
    
    // Check Drawer opens
    cy.contains('Inquiry Details').should('be.visible');
    
    // Click Convert to Quote
    cy.contains('Convert to Quote').click();
    
    // Should navigate to quote details page
    cy.url().should('include', '/dashboard/quotes/');
    
    // Validate Quote details (should have items)
    cy.contains('ZQB-').should('be.visible');
    
    // Go back to inquiries to verify status changed
    cy.visit('/dashboard/inquiries');
    cy.get('tbody tr').first().contains('CONVERTED').should('be.visible');
  });
});
