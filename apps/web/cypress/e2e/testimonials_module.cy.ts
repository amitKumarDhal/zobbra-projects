describe('Testimonials Module', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
  });

  it('executes the full testimonials management journey', () => {
    // 1. Open /dashboard/testimonials
    cy.visit('/dashboard/testimonials');
    cy.contains('h1', 'Testimonials').should('be.visible');
    cy.contains('Loading testimonials...').should('not.exist');

    // 2. Verify real KPI values (Zero initially if DB is clean)
    cy.contains('Total Testimonials').parent().find('h3').should('exist');

    // 3. Open Add Testimonial and Save
    cy.contains('button', 'Add New Testimonial').click();
    cy.contains('h2', 'Add New Testimonial').should('be.visible');

    // Fill form
    cy.get('input[name="customerName"]').type('Cypress Test User');
    cy.get('input[name="companyName"]').type('Cypress Corp');
    cy.get('textarea[name="content"]').type('This is a great product created via automated testing.');
    
    // Select status PUBLISHED
    cy.get('input[value="PUBLISHED"]').check();

    // Save
    cy.contains('button', 'Save Testimonial').click();

    // Drawer should close
    cy.contains('h2', 'Add New Testimonial').should('not.exist');
    
    // Testimonial should be in the table
    cy.contains('Cypress Test User').should('be.visible');
    cy.contains('Published').should('be.visible');

    // 4. Search testimonial
    cy.get('input[placeholder*="Search"]').type('Cypress Corp');
    cy.wait(500); // wait for re-render if debounced
    cy.contains('Cypress Test User').should('be.visible');

    // 5. Filter status
    cy.get('select').eq(0).select('PENDING'); // Index 0 is status filter
    cy.contains('Cypress Test User').should('not.exist');
    
    cy.get('select').eq(0).select('PUBLISHED');
    cy.contains('Cypress Test User').should('be.visible');


    // 6. Edit testimonial and change status
    cy.contains('Loading testimonials...').should('not.exist');
    cy.get('button[title="Edit"]').first().click({ force: true });
    cy.contains('h2', 'Edit Testimonial').should('be.visible');
    
    // Change to INACTIVE
    cy.get('input[value="INACTIVE"]').check();
    cy.contains('button', 'Save Changes').click();
    
    // Verify it updated in the table
    cy.contains('Inactive').should('be.visible');

    // 7. Delete testimonial
    // First reset filter to ALL (empty string value) so INACTIVE testimonial is visible
    cy.get('select').eq(0).select('');
    cy.contains('Cypress Test User', { timeout: 6000 }).should('be.visible');
    
    // Mock the confirm dialog to return true
    // @ts-ignore
    cy.on('window:confirm', () => true);
    
    // Delete the testimonial
    cy.contains('Loading testimonials...').should('not.exist');
    cy.get('button[title="Delete"]').first().click({ force: true });
    
    // Should be removed
    cy.contains('Cypress Test User').should('not.exist');
  });
});
