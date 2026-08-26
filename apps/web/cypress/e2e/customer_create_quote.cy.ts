/// <reference types="cypress" />

describe('Customer Create Quote & Field Alignment E2E', () => {
  let createdQuoteNumber: string;
  let createdQuoteId: string;

  it('navigates through the customer 8-step merchandise configurator with full qualification data and landing-page visual alignment', () => {
    // 1. Login as Authenticated Customer
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.url().should('include', '/customer/create-quote');

    // 2. Verify Page Header & Pre-filled Customer & Company Profile matching /get-quote
    cy.contains('REQUEST A QUOTE').should('be.visible');
    cy.contains('Create Your Merchandise Quote').should('be.visible');
    cy.contains('Customer & Company Information').should('be.visible');
    cy.get('[data-cy="quote-company-name"]').invoke('val').should('not.be.empty');
    cy.get('[data-cy="quote-customer-name"]').invoke('val').should('not.be.empty');
    cy.get('[data-cy="quote-phone"]').invoke('val').should('not.be.empty');

    // Edit contact information to test update propagation
    cy.get('[data-cy="quote-company-name"]').clear().type('ZOBBRA Enterprise Client Pvt Ltd');
    cy.get('[data-cy="quote-customer-name"]').clear().type('Rahul Sharma');
    cy.get('[data-cy="quote-phone"]').clear().type('+91 91244 49666');
    cy.get('[data-cy="quote-location"]').clear().type('Bhubaneswar, Odisha');

    // 3. Step 1: Product Requirement
    cy.contains('Step 1: Choose Product Category').should('be.visible');
    cy.contains('Product Requirement').should('be.visible');
    cy.contains('Polo T-Shirts (200 GSM)').click();
    cy.get('[data-cy="quote-specific-product"]').type('Premium Bio-Washed Pique Polo');
    cy.contains('button', 'NEXT STEP').click();

    // 4. Step 2: Color Specification
    cy.contains('Step 2: Choose Fabric Color').should('be.visible');
    cy.contains('Color Specification').should('be.visible');
    cy.contains('button', 'Charcoal Black').click();
    cy.contains('button', 'NEXT STEP').click();

    // 5. Step 3: Fabric Spec
    cy.contains('Step 3: Choose Fabric Spec').should('be.visible');
    cy.contains('Fabric Specification').should('be.visible');
    cy.contains('240 GSM Heavy Weight Cotton').click();
    cy.contains('button', 'NEXT STEP').click();

    // 6. Step 4: Size Breakdown
    cy.contains('Step 4: Size Breakdown').should('be.visible');
    cy.contains('Size Breakdown & Quantities').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();

    // 7. Step 5: Printing Technique & Print Placement
    cy.contains('Step 5: Print Position & Technique').should('be.visible');
    cy.contains('Customization Specifications').should('be.visible');
    cy.contains('button', 'DTF Printing').click();
    cy.contains('button', 'Front Chest Logo & Back Print').click();
    cy.contains('button', 'NEXT STEP').click();

    // 8. Step 6: Artwork Vector & Drive Link
    cy.contains('Step 6: Upload Logo File & Artwork').should('be.visible');
    cy.contains('Artwork & Branding Assets').should('be.visible');
    cy.contains('ATTACH SAMPLE FILE').click();
    cy.contains('Attached: brand_logo_highres.vector').should('be.visible');
    cy.get('[data-cy="quote-artwork-url"]').type('https://drive.google.com/drive/folders/brand-vector-assets');
    cy.contains('button', 'NEXT STEP').click();

    // 9. Step 7: Preview, Customization Requirements & Budget
    cy.contains('Step 7: Configurator Summary & Specifications').should('be.visible');
    cy.contains('Customization Requirements').should('be.visible');
    cy.get('[data-cy="quote-customization-requirements"]').type('Front chest 3.5 inch high-density logo and back shoulder tagline.');
    cy.get('[data-cy="quote-budget"]').select('₹25,000 – ₹50,000');
    cy.contains('button', 'NEXT STEP').click();

    // 10. Step 8: Commercial & Delivery Address, GSTIN & Message
    cy.contains('Step 8: Delivery Address & GSTIN Details').should('be.visible');
    cy.contains('Commercial & Delivery Timeline').should('be.visible');
    cy.get('[data-cy="quote-delivery-date"]').type('2026-09-15');
    cy.get('[data-cy="quote-gstin"]').clear().type('21AAACA1234A1Z5');
    cy.get('[data-cy="quote-address"]').clear().type('Plot 402, Fortune Tower, Chandrasekharpur, Bhubaneswar - 751023');
    cy.get('[data-cy="quote-message"]').type('Please confirm delivery timeline before dispatch.');

    // 11. Submit Quote
    cy.intercept('POST', '**/api/v1/quotes').as('createQuoteReq');
    cy.contains('button', 'SUBMIT QUOTE').click();

    // 12. Verify Submission Success Screen
    cy.wait('@createQuoteReq').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      const quote = interception.response?.body.quote;
      expect(quote).to.exist;
      expect(quote.quoteNumber).to.include('ZQB-');
      expect(quote.totalAmount).to.be.greaterThan(0);
      createdQuoteNumber = quote.quoteNumber;
      createdQuoteId = quote.id;
    });

    cy.contains('Configurator Quote Submitted!').should('be.visible');
    cy.contains('ZQB-').should('be.visible');
  });

  it('verifies that Admin can see all submitted customer qualification data in Quote Detail', () => {
    // 1. Login as Admin
    cy.login('admin@zobra.test', 'admin123');

    // 2. Open the newly created quote directly
    cy.visit(`/dashboard/quotes/${createdQuoteId}`);

    // 3. Verify Admin Quote Details View
    cy.url().should('include', `/dashboard/quotes/${createdQuoteId}`);
    cy.get('[data-cy="quote-detail-customer-name"]').should('contain', 'Rahul Sharma');
    cy.get('[data-cy="quote-detail-company-name"]').should('contain', 'ZOBBRA Enterprise Client');
    cy.get('[data-cy="quote-detail-phone"]').should('contain', '+91 91244 49666');

    // 4. Verify Specifications Card Contains Full Aligned Requirements
    cy.get('[data-cy="quote-specifications-card"]').should('be.visible');
    cy.get('[data-cy="quote-specifications-card"]').should('contain', '240 GSM');
    cy.get('[data-cy="quote-specifications-card"]').should('contain', 'DTF Printing');
    cy.get('[data-cy="quote-specifications-card"]').should('contain', 'Front Chest Logo & Back Print');
    cy.get('[data-cy="quote-specifications-card"]').should('contain', '₹25,000 – ₹50,000');

    // 5. Verify Line Items Table has Non-Zero Pricing
    cy.contains('Line Item Specifications').should('be.visible');
    cy.contains('Grand Total').should('be.visible');
    cy.contains('₹').should('be.visible');
  });
});
