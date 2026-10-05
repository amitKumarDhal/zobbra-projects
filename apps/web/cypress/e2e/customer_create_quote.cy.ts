/// <reference types="cypress" />

describe('Customer Request Quote — Get Quote form', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsCustomer();
    cy.visit('/customer/create-quote');
  });

  it('shows the Get Quote fields', () => {
    cy.get('#quote-name').should('be.visible');
    cy.get('#quote-email').should('be.visible');
    cy.get('#quote-country').should('contain', 'IN +91');
    cy.get('#quote-phone').should('be.visible');
    cy.get('#quote-product').should('have.attr', 'placeholder', 'e.g. Custom T-shirts, Jerseys');
    cy.get('#quote-quantity').should('contain', 'Select quantity range');
    cy.get('#quote-message').should('be.visible');
    cy.contains('Upload Design Reference').should('be.visible');
    cy.get('#submit-quote-btn').should('contain', 'Get a Quote');
  });

  it('does not submit without the required product and quantity', () => {
    cy.intercept('POST', '**/api/v1/inquiries').as('createInquiryReq');
    cy.get('#submit-quote-btn').click();
    cy.get('@createInquiryReq.all').should('have.length', 0);
    cy.url().should('include', '/customer/create-quote');
  });

  it('submits the request and redirects to customer quotes', () => {
    cy.get('#quote-name').then(($el) => {
      if (!$el.val()) cy.wrap($el).type('Test Customer');
    });
    cy.get('#quote-phone').then(($el) => {
      if (!$el.val()) cy.wrap($el).type('9876543210');
    });

    cy.get('#quote-product').type('Custom T-shirts');
    cy.get('#quote-quantity').select('100 – 250');
    cy.get('#quote-message').type('Front logo print, needed in 3 weeks');

    cy.intercept('POST', '**/api/v1/inquiries').as('createInquiryReq');
    cy.get('#submit-quote-btn').click();

    cy.wait('@createInquiryReq').then((interception) => {
      expect(interception.request.body.productInterest).to.eq('Custom T-shirts');
      expect(interception.request.body.quantity).to.eq(100);
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.response?.body.inquiryNumber).to.match(/^INQ-/);
      expect(interception.response?.body.customerType).to.eq('REGISTERED');
    });

    cy.contains('Quote Request Submitted!').should('be.visible');
    cy.url({ timeout: 10000 }).should('include', '/customer/quotes');
  });
});
