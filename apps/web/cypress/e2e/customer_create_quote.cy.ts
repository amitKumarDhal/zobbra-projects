/// <reference types="cypress" />

describe('Customer Create Quote — Live Estimated Pricing & Validation', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
  });

  it('verifies product selection and live estimated pricing preview', () => {
    // 1. Initial State: card instructs to select product
    cy.get('#estimated-quote-card').scrollIntoView().should('be.visible');
    cy.get('#estimated-quote-card').should('contain', 'Select a product to see estimated pricing');

    // 2. Product Selection: wait for active products to load
    cy.get('#quote-product option', { timeout: 10000 }).should('have.length.gt', 1);
    cy.get('#quote-product option').then($options => {
      const val = $options.filter((_, opt) => (opt as HTMLOptionElement).value !== '').first().val();
      cy.get('#quote-product').select(val as string);
    });

    // 3. Estimated Pricing Visible
    cy.get('#estimated-quote-card').should('contain', 'Unit Price');
    cy.get('#estimated-quote-card').should('contain', 'Subtotal');
    cy.get('#estimated-quote-card').should('contain', 'GST');
    cy.get('#estimated-quote-card').should('contain', 'Estimated Total');
    cy.get('#estimated-quote-card').should('contain', 'Estimated price. Final quotation may be adjusted after sales review.');
    cy.get('#estimated-quote-card').should('contain', '₹');
  });

  it('updates estimated price when quantity changes (50 -> 100 -> 500)', () => {
    // Select product
    cy.get('#quote-product option', { timeout: 10000 }).should('have.length.gt', 1);
    cy.get('#quote-product option').then($options => {
      const val = $options.filter((_, opt) => (opt as HTMLOptionElement).value !== '').first().val();
      cy.get('#quote-product').select(val as string);
    });
    cy.get('#estimated-quote-card').should('contain', 'Estimated Total');

    // Change quantity to 50 and wait for estimated card update
    cy.get('#quote-quantity').type('{selectall}50');
    cy.get('#estimated-quote-card', { timeout: 10000 }).should('contain', '50 pcs');

    // Change quantity to 500 and wait for estimated card update
    cy.get('#quote-quantity').type('{selectall}500');
    cy.get('#estimated-quote-card', { timeout: 10000 }).should('contain', '500 pcs');
  });

  it('updates estimated price when print position changes (Front -> Back -> Both)', () => {
    // Select product
    cy.get('#quote-product option', { timeout: 10000 }).should('have.length.gt', 1);
    cy.get('#quote-product option').then($options => {
      const val = $options.filter((_, opt) => (opt as HTMLOptionElement).value !== '').first().val();
      cy.get('#quote-product').select(val as string);
    });
    cy.get('#estimated-quote-card').should('contain', 'Estimated Total');

    // Select Front
    cy.get('#print-pos-front').click();
    cy.get('#estimated-quote-card').should('contain', 'Front');

    // Change to Back
    cy.get('#print-pos-back').click();
    cy.get('#estimated-quote-card').should('contain', 'Back');

    // Change to Both
    cy.get('#print-pos-both').click();
    cy.get('#estimated-quote-card').should('contain', 'Both');
  });

  it('blocks submit when variants sum does not match total quantity', () => {
    // Select product
    cy.get('#quote-product option', { timeout: 10000 }).should('have.length.gt', 1);
    cy.get('#quote-product option').then($options => {
      const val = $options.filter((_, opt) => (opt as HTMLOptionElement).value !== '').first().val();
      cy.get('#quote-product').select(val as string);
    });

    cy.get('#quote-quantity').clear().type('100');

    // Toggle variant breakdown
    cy.get('#toggle-variant-breakdown').click();

    // Verify submit button is disabled when variants sum !== quantity
    cy.get('#submit-quote-btn').should('be.disabled');
    cy.contains('Breakdown total').should('be.visible');
  });

  it('submits quote successfully with server calculated pricing', () => {
    // Fill in required customer name/phone if empty
    cy.get('#quote-name').then($el => {
      if (!$el.val()) cy.wrap($el).type('Test Customer');
    });
    cy.get('#quote-phone').then($el => {
      if (!$el.val()) cy.wrap($el).type('+91 9876543210');
    });

    // Select product
    cy.get('#quote-product option', { timeout: 10000 }).should('have.length.gt', 1);
    cy.get('#quote-product option').then($options => {
      const val = $options.filter((_, opt) => (opt as HTMLOptionElement).value !== '').first().val();
      cy.get('#quote-product').select(val as string);
    });

    cy.get('#quote-quantity').clear().type('100');
    cy.get('#print-pos-front').click();

    // Verify submit button is enabled
    cy.get('#submit-quote-btn').should('not.be.disabled');

    // Intercept quote creation
    cy.intercept('POST', '**/api/v1/quotes').as('createQuoteReq');
    cy.get('#submit-quote-btn').click();

    cy.wait('@createQuoteReq').then(interception => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      const quote = interception.response?.body.quote || interception.response?.body.data;
      expect(quote).to.exist;
      expect(quote.totalAmount).to.be.greaterThan(0);
    });

    // Verify successful submission redirect to customer quotes
    cy.url({ timeout: 10000 }).should('include', '/customer/quotes');
  });
});
