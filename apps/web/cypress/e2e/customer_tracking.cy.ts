/// <reference types="cypress" />

describe('Customer Shipment Tracking Coming Soon Experience', () => {
  it('verifies that /customer/tracking renders a professional Coming Soon state without fake courier/AWB data', () => {
    // 1. Login as customer
    cy.loginAsCustomer();

    // 2. Open /customer/tracking
    cy.visit('/customer/tracking');
    cy.url().should('include', '/customer/tracking');

    // 3. Verify Page Headers and Badge
    cy.contains('COMING SOON').should('be.visible');
    cy.contains('h1', 'Shipment Tracking').should('be.visible');
    cy.contains('Live shipment tracking will be available soon.').should('be.visible');

    // 4. Verify Professional Coming Soon Notice
    cy.get('[data-cy="tracking-coming-soon"]').should('be.visible');
    cy.contains('Real-Time Courier Tracking').should('be.visible');
    cy.contains('Courier tracking integration is currently under development.').should('be.visible');

    // 5. Verify NO Fake AWB or Fake Courier Data Exists
    cy.contains('BLUEDART-9922').should('not.exist');
    cy.contains('BlueDart Express').should('not.exist');
    cy.contains('Package Picked Up by BlueDart Courier').should('not.exist');
    cy.contains('In Transit to Kolkata Distribution Center').should('not.exist');
    cy.contains('Out for Delivery to Client Facility').should('not.exist');

    // 6. Verify Action Buttons — WhatsApp goes to the ZOBBRA sales line, not the customer
    cy.get('[data-cy="view-all-orders-btn"]').should('be.visible');
    cy.get('[data-cy="tracking-whatsapp-btn"]')
      .should('be.visible')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('include', 'https://wa.me/919124449665');

    // 7. Verify Navigation to My Orders
    cy.get('[data-cy="view-all-orders-btn"]').click();
    cy.url().should('include', '/customer/orders');
  });
});
