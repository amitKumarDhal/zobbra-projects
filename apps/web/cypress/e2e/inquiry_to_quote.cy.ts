describe('Inquiry to Quote Conversion Flow', () => {
  const companyName = `Conversion Corp ${Date.now()}`;
  let inquiryId = '';
  let inquiryNumber = '';

  before(() => {
    cy.intercept('POST', '**/api/v1/inquiries').as('createInq');
    // Submit an inquiry to convert
    cy.visit('/get-quote');
    cy.get('[data-cy="company-name-input"]').type(companyName);
    cy.get('[data-cy="contact-name-input"]').type('Conversion Lead');
    cy.get('[data-cy="phone-input"]').type('9876500000');
    cy.get('[data-cy="email-input"]').type(`lead-${Date.now()}@convcorp.test`);
    cy.get('[data-cy="category-select"]').select('Polo T-Shirts');
    cy.get('[data-cy="quantity-input"]').focus().type('{selectall}120');
    cy.get('[data-cy="colors-input"]').type('Charcoal Black');
    cy.get('[data-cy="printing-type-select"]').select('Screen Printing');
    cy.get('[data-cy="print-position-select"]').select('Front + Back');
    cy.get('[data-cy="customization-textarea"]').type('Corporate anniversary merchandise with high-density print');

    cy.get('[data-cy="submit-inquiry-btn"]').click();

    cy.wait('@createInq', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      inquiryId = interception.response?.body.id;
      inquiryNumber = interception.response?.body.inquiryNumber;
    });

    cy.contains(/Inquiry Submitted!/i).should('be.visible');
  });

  it('Step 1: Admin reviews inquiry and converts to quote with pre-filled specs & pricing', () => {
    cy.viewport(1280, 800);
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/inquiries');

    // Wait for inquiry list
    cy.contains(companyName, { timeout: 15000 }).click();

    // Verify Drawer opens
    cy.get('[data-cy="inquiry-drawer"]').should('be.visible');
    cy.contains('Charcoal Black').should('exist');

    // Click Convert to Quote
    cy.contains('Convert to Quote').click();

    // Verify redirection to Quote Detail page
    cy.url({ timeout: 15000 }).should('include', '/dashboard/quotes/');

    // Validate Quote Header & Number
    cy.contains(/ZQB-\d{4}-\d{4}/).should('be.visible');

    // Validate Financial Integrity (Items exist and financials are non-zero)
    cy.get('body').then(($body) => {
      // Subtotal, GST, and Total Amount must be positive
      cy.contains(/Subtotal|Base Amount/i).parent().invoke('text').should('not.match', /₹\s*0(\.00)?$/);
      cy.contains(/Grand Total|Total Amount/i).parent().invoke('text').should('not.match', /₹\s*0(\.00)?$/);
      // Item quantity must match the inquiry
      cy.contains('120').should('be.visible');
    });

    // Go back to Inquiries and verify status is updated to CONVERTED
    cy.visit('/dashboard/inquiries');
    cy.contains(companyName).closest('tr').should('contain', 'Converted');
  });
});
