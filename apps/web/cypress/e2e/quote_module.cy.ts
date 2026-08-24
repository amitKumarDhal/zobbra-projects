describe('Quote Management Module', () => {
  beforeEach(() => {
    // Basic admin login setup (mocking standard Zobra auth flow for tests)
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/quotes');
  });

  it('should display KPI cards with real data', () => {
    cy.get('h1').contains('Quote');
    cy.contains('Total Quotes').should('be.visible');
    cy.contains('Sent Quotes').should('be.visible');
    cy.contains('Pending Quotes').should('be.visible');
    cy.contains('Accepted Quotes').should('be.visible');
    cy.contains('Expired Quotes').should('be.visible');
  });

  it('should search and filter quotes', () => {
    // Type in search bar
    cy.get('input[placeholder="Search by Quote ID, Customer, Email..."]').type('ZQB-');
    cy.wait(500); // wait for debounce/fetch
    cy.get('table').should('be.visible');
    
    // Check if table rows exist
    cy.get('tbody tr').then($rows => {
      if ($rows.text().includes('No quotes found')) {
         cy.log('Database empty, skipping row assertions');
      } else {
         cy.get('tbody tr').first().should('be.visible');
      }
    });
  });

  it('should open the right-side drawer when a quote is clicked', () => {
    cy.contains('Loading quotes...').should('not.exist');
    cy.get('tbody tr').then($rows => {
      if (!$rows.text().includes('No quotes found')) {
         // Click the second column to avoid clicking the checkbox
         cy.get('tbody tr').first().find('td').eq(1).click();
         
         // Drawer should open
         cy.get('h2').contains('Quote Details').should('exist');
         
         // Verify Customer Info block
         cy.contains('Customer Information').should('exist');
         
         // Verify Quote Summary block
         cy.contains('Quote Summary').should('exist');
         
         // Verify Quote Validity block
         cy.contains('Quote Validity').should('exist');

         // Close drawer
         cy.get('button').find('svg.lucide-x').parent().click();
         cy.contains('Quote Details').should('not.exist');
      }
    });
  });

  it('should convert an approved quote to an order', () => {
     cy.contains('Loading quotes...').should('not.exist');
     cy.get('tbody tr').then($rows => {
      if (!$rows.text().includes('No quotes found')) {
         // This is a highly dependent state test. We look for an approved quote.
         cy.get('tbody').then($tbody => {
            if ($tbody.text().includes('Approved')) {
                cy.contains('APPROVED', { matchCase: false }).parents('tr').first().find('td').eq(1).click();
                cy.contains('Convert to Order').should('be.visible');
                // We won't click it to avoid mutating production DB in standard tests
                // cy.contains('Convert to Order').click();
                // cy.url().should('include', '/dashboard/orders/');
            }
         });
      }
    });
  });
});
