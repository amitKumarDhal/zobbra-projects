describe('Agents / Sales Team Module', () => {
  beforeEach(() => {
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.visit('/dashboard/agents');
  });

  it('should render the Agents dashboard and real KPI cards', () => {
    cy.get('h1').contains('Agents').should('be.visible');
    
    // Check KPI Cards
    cy.contains('Total Agents').should('be.visible');
    cy.contains('Active Agents').should('be.visible');
    cy.contains('Total Sales').should('be.visible');
    cy.contains('Top Performer').should('be.visible');
  });

  it('should search and filter agents', () => {
    cy.get('input[placeholder="Search agents by name, email, phone..."]').type('Admin');
    cy.wait(500); // debounce wait
    cy.get('select').first().select('Active');
    cy.wait(500);
    cy.get('table').should('be.visible');
  });

  it('should render the Performance Chart and Top Performers', () => {
    cy.contains('h3', 'Agent Performance (This Month)').should('be.visible');
    cy.contains('h3', 'Top Performers').should('be.visible');
    cy.contains('h3', 'Quick Actions').should('be.visible');
  });

  it('should open agent detail page and verify performance summary', () => {
    cy.get('table tbody tr').then($rows => {
      if (!$rows.text().includes('No agents found')) {
         cy.get('table tbody tr').first().find('a[title="View"]').click();
         cy.contains('h1', 'Agent Profile', { timeout: 10000 }).should('be.visible');
         
         // Check stats
         cy.contains('Customers').should('be.visible');
         cy.contains('Inquiries').should('be.visible');
         cy.contains('Quotes').should('be.visible');
         cy.contains('Orders').should('be.visible');
         cy.contains('Revenue').should('be.visible');
         cy.contains('Conversion').should('be.visible');

         // Tab checks
         cy.contains('button', 'Customers').click();
         cy.contains('h3', 'Customers Details').should('be.visible');
      }
    });
  });
});
