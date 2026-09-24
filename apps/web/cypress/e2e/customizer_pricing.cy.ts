/// <reference types="cypress" />

describe('Customizer — Live Estimated Pricing & Variant Validation', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/products/classic-corporate-polo-tshirt/customize');
  });

  it('displays server pricing estimate and updates when quantity changes', () => {
    cy.url().should('include', '/customize');

    // Verify pricing card
    cy.get('#customizer-pricing-card').should('be.visible');
    cy.get('#customizer-pricing-card').should('contain', 'Total Estimate');
    cy.get('#customizer-pricing-card').should('contain', 'Estimated price. Final quotation may be adjusted after sales review.');
    cy.get('#customizer-pricing-card').should('contain', 'Unit Rate');
    cy.get('#customizer-pricing-card').should('contain', 'Subtotal');
    cy.get('#customizer-pricing-card').should('contain', 'GST');

    // Initial MOQ quantity is 20 pcs
    cy.get('#customizer-pricing-card').should('contain', 'Unit Rate (20 pcs)');

    // Change tier to 50
    cy.contains('button', '50').click();
    cy.get('#customizer-pricing-card').should('contain', 'Unit Rate (50 pcs)');

    // Change tier to 100
    cy.contains('button', '100').click();
    cy.get('#customizer-pricing-card').should('contain', 'Unit Rate (100 pcs)');

    // Change tier to 250
    cy.contains('button', '250').click();
    cy.get('#customizer-pricing-card').should('contain', 'Unit Rate (250 pcs)');
  });

  it('blocks proceed when variant breakdown total does not match total quantity', () => {
    cy.url().should('include', '/customize');

    // Initial state: single variant matches total quantity (20)
    cy.get('#customizer-proceed-btn').should('not.be.disabled');

    // Remove the default full-quantity variant so remaining > 0
    cy.get('button[title="Remove"]').click();

    // Add a partial variant (10 pcs of 20 total)
    cy.get('#variant-color-input').type('Navy Blue');
    cy.get('#variant-size-input').type('M');
    cy.get('#variant-quantity-input').clear().type('{selectall}10');
    cy.get('#variant-add-btn').click();

    // Now variant sum is 10, total quantity is 20 -> Mismatch!
    cy.contains('Variant Mismatch').should('be.visible');
    cy.get('#customizer-proceed-btn').should('be.disabled');

    // Complete the remaining 10 pcs (quantity is automatically prefilled with remaining 10)
    cy.get('#variant-color-input').type('White');
    cy.get('#variant-size-input').type('L');
    cy.get('#variant-add-btn').click();

    // Now variant sum is 10 + 10 = 20 === total quantity (20) -> Valid!
    cy.contains('Variant Mismatch').should('not.exist');
    cy.get('#customizer-proceed-btn').should('not.be.disabled');
  });
});
