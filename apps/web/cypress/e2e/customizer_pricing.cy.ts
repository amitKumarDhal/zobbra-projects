/// <reference types="cypress" />

/**
 * The customizer is a pure design studio: no price, quantity or order summary is shown anywhere
 * (desktop or mobile). Quantity/variant state is still submitted with the quote.
 */
const PRICE_TEXT = /Total Estimate|Estimated Total|Unit Rate|Subtotal|GST|₹|Quantity|MOQ|pcs/;

const expectNoPricingUi = () => {
  cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
  cy.get('#customizer-pricing-card').should('not.exist');
  cy.get('#customizer-quantity-input').should('not.exist');
  cy.get('#variant-section-toggle').should('not.exist');
  cy.get('#tab-tool-order').should('not.exist');
  // innerText = rendered text only (ignores inline script payloads)
  cy.get('body').should(($b) => expect($b[0].innerText).not.to.match(PRICE_TEXT));
  // Exactly one Front/Back toggle and one Proceed button
  cy.get('#btn-switch-front').should('have.length', 1);
  cy.get('#btn-switch-back').should('have.length', 1);
  cy.get('#customizer-proceed-btn').should('have.length', 1).and('contain', 'Proceed').and('not.be.disabled');
  cy.get('#customizer-proceed-btn').invoke('text').should('not.match', /₹|\d/);
};

describe('Customizer - no pricing or quantity UI', () => {
  it('desktop: design studio layout without a price/order panel', () => {
    cy.viewport(1280, 800);
    cy.visit('/products/classic-corporate-polo-tshirt/customize');
    expectNoPricingUi();
    cy.contains('Customize your design').should('be.visible');
    cy.get('#customizer-design-guide').should('be.visible').and('contain', 'Design area');
  });

  it('tablet: side panel layout without a price/order panel', () => {
    cy.viewport(820, 1180);
    cy.visit('/products/classic-corporate-polo-tshirt/customize');
    expectNoPricingUi();
    cy.get('#tab-tool-colors').should('be.visible');
  });

  it('mobile: no price/quantity summary and no horizontal overflow', () => {
    cy.viewport(390, 844);
    cy.visit('/products/classic-corporate-polo-tshirt/customize');
    expectNoPricingUi();
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  });
});
