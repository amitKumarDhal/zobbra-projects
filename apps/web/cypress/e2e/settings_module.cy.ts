describe('Settings Module', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });

  it('navigates to settings and views general settings', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('Settings').should('be.visible');
    cy.contains('General Settings').should('be.visible');
    cy.get('input[name="siteName"]').should('exist');
  });

  it('updates a general setting', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.get('input[name="siteName"]').clear().type('ZOBRA TEST');
    cy.contains('Save Changes').click();
    
    // Verify reload persistence
    cy.reload();
    cy.get('input[name="siteName"]').should('have.value', 'ZOBRA TEST');
    
    // Cleanup
    cy.get('input[name="siteName"]').clear().type('ZOBRA');
    cy.contains('Save Changes').click();
  });

  it('views and updates company profile', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('Company Profile').click();
    cy.contains('Your business information').should('be.visible');
    
    cy.get('input[name="phone"]').clear().type('9999999999');
    cy.contains('Save Changes').click();
    
    cy.reload();
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('Company Profile').click();
    cy.get('input[name="phone"]').should('have.value', '9999999999');
  });

  it('views system information and health', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('System Information').should('be.visible');
    cy.contains('PostgreSQL').should('be.visible');
    cy.contains('System Health').should('be.visible');
    cy.contains('Healthy').should('be.visible');
  });

  it('views activity log', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('Activity Log').click();
    cy.contains('Activity Log').should('be.visible');
    // Ensure we see the settings update we just performed
    cy.contains('Updated system setting: siteName').should('exist');
  });

  it('does not expose secrets in payment settings', () => {
    cy.visit('/dashboard/settings');
    cy.contains('Loading settings...').should('not.exist');
    cy.contains('Payment Settings').click();
    cy.contains('Razorpay').should('be.visible');
    cy.contains('Key ID').should('be.visible');
    // Ensure actual secrets aren't shown
    cy.contains('rzp_test_****1234').should('exist');
  });
});
