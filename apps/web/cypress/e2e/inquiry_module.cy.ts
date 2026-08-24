describe('Inquiry Module (E2E)', () => {
  beforeEach(() => {
    // 1. Intercept API requests
    cy.intercept('GET', '**/api/v1/inquiries*').as('getInquiries');
    cy.intercept('GET', '**/api/v1/inquiries/stats').as('getStats');
    cy.intercept('GET', '**/api/v1/inquiries/*').as('getInquiryDetails');
    cy.intercept('POST', '**/api/v1/inquiries/*/activity').as('addActivity');
    cy.intercept('POST', '**/api/v1/inquiries/*/convert-to-quote').as('convertToQuote');
    
    // 2. Login as admin
    cy.login('admin@zobra.test', 'admin123');

    // Ensure at least one inquiry exists
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/inquiries',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          source: 'WEBSITE',
          productInterest: 'Corporate Hoodies 320 GSM',
          quantity: 100,
          budget: '50000',
          message: 'Need 100 corporate hoodies for team offsite',
        },
      });
    });
    
    // 3. Navigate to inquiries dashboard
    cy.visit('/dashboard/inquiries');
    cy.wait('@getInquiries');
    cy.wait('@getStats');
  });

  it('loads the inquiries dashboard with KPI cards and table', () => {
    cy.contains('h1', 'Inquiry').should('be.visible');
    cy.contains('Manage all customer inquiries and follow-ups').should('be.visible');
    
    // Verify KPI Cards
    cy.contains('Total Inquiries').should('be.visible');
    cy.contains('New Inquiries').should('be.visible');
    cy.contains('Contacted').should('be.visible');
    
    // Verify Table Headers
    cy.contains('th', 'Inquiry ID').should('be.visible');
    cy.contains('th', 'Customer').should('be.visible');
    cy.contains('th', 'Product Interested').should('be.visible');
  });

  it('opens inquiry drawer and adds a note', () => {
    // Wait for table to load and click the first row
    cy.contains('Loading inquiries...').should('not.exist');
    cy.get('tbody tr').not(':contains("Loading")').first().find('td').eq(1).click();
    cy.wait('@getInquiryDetails');
    
    // Drawer should open
    cy.contains('h2', 'Inquiry Details').should('be.visible');
    cy.contains('Customer Information').should('be.visible');
    cy.contains('Inquiry Information').should('be.visible');
    
    // Add a note
    cy.get('[data-cy="inquiry-note-input"]').type('Test E2E Note');
    cy.get('[data-cy="add-note-btn"]').click();
    cy.wait('@addActivity');
    
    // Note should appear in timeline
    cy.contains('Test E2E Note').should('be.visible');
  });

  it('can convert an inquiry to a quote', () => {
    cy.contains('Loading inquiries...').should('not.exist');
    cy.get('tbody tr').filter(':contains("New"), :contains("Contacted"), :contains("Follow-up")').first().find('td').eq(1).click();
    cy.wait('@getInquiryDetails');
    
    cy.contains('button', 'Convert to Quote').click();
    cy.wait('@convertToQuote').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });
    
    cy.url().should('include', '/dashboard/quotes/');
  });
});
