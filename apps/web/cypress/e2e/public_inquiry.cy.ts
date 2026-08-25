describe('ZOBBRA Public Inquiry / Get-Quote Flow', () => {
  const testGuestCompany = `Acme Test ${Date.now()}`;
  const testGuestName = 'Rahul Mishra';
  const testGuestPhone = '9876543210';
  const testGuestEmail = `guest-${Date.now()}@acmetest.com`;
  const testLocation = 'Mumbai, Maharashtra';
  const testColor = 'Navy Blue';
  const testSizes = 'S: 20, M: 50, L: 30';
  const testCustomization = 'Front embroidered logo and back screen print';
  let generatedInquiryNumber = '';

  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/inquiries').as('postInquiry');
  });

  it('Step 1: Submits a comprehensive Guest Inquiry with all optional fields', () => {
    cy.visit('/get-quote');

    // 1. Customer & Company Info
    cy.get('[data-cy="company-name-input"]').type(testGuestCompany);
    cy.get('[data-cy="contact-name-input"]').type(testGuestName);
    cy.get('[data-cy="phone-input"]').type(testGuestPhone);
    cy.get('[data-cy="email-input"]').type(testGuestEmail);
    cy.get('[data-cy="location-input"]').type(testLocation);

    // 2. Product Requirement
    cy.get('[data-cy="category-select"]').select('Cotton Caps');
    cy.get('[data-cy="specific-product-input"]').type('Embroidered Premium Twill Cap');
    cy.get('[data-cy="quantity-input"]').focus().type('{selectall}150');

    // 3. Customization
    cy.get('[data-cy="colors-input"]').type(testColor);
    cy.get('[data-cy="sizes-input"]').type(testSizes);
    cy.get('[data-cy="printing-type-select"]').select('Embroidery');
    cy.get('[data-cy="print-position-select"]').select('Front');
    cy.get('[data-cy="artwork-url-input"]').type('https://drive.google.com/test-artwork.png');
    cy.get('[data-cy="customization-textarea"]').type(testCustomization);

    // 4. Commercial & Delivery
    cy.get('[data-cy="budget-select"]').select('₹25,000 – ₹50,000');

    // Submit
    cy.get('[data-cy="submit-inquiry-btn"]').click();

    cy.wait('@postInquiry', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      generatedInquiryNumber = interception.response?.body.inquiryNumber;
      expect(generatedInquiryNumber).to.match(/^INQ-\d{4}-\d{4}$/);
    });

    // Verify Success Screen
    cy.contains(/Inquiry submitted successfully/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/Inquiry Submitted!/i).should('be.visible');
    cy.contains(/Your Inquiry ID/i).should('be.visible');
    cy.contains(/Thank you. Our sales team will review your requirements and contact you shortly./i).should('be.visible');
    cy.get('[data-cy="inquiry-id-display"]').should('contain', 'INQ-');
  });

  it('Step 2: Admin reviews the created Inquiry and verifies all captured qualification fields', () => {
    cy.viewport(1280, 800);
    cy.login('admin@zobra.test', 'admin123');
    cy.visit('/dashboard/inquiries');

    // Wait for table to load
    cy.contains('INQ-', { timeout: 15000 }).should('be.visible');

    // Click into the newly created inquiry row
    cy.contains(testGuestCompany).first().click();

    // Verify Drawer opens and contains all customer and qualification fields
    cy.get('[data-cy="inquiry-drawer"]').scrollIntoView().should('be.visible').within(() => {
      cy.contains('Inquiry Details').should('exist');
      cy.contains(testGuestName).should('exist');
      cy.contains(testGuestCompany).should('exist');
      cy.contains(testGuestPhone).should('exist');
      cy.contains(testGuestEmail).should('exist');
      cy.contains(testLocation).should('exist');
      cy.contains('GUEST').should('exist');

      // Verify Inquiry Specifications in Drawer
      cy.contains(/150\s*Pieces/i).should('exist');
      cy.contains('Embroidery').should('exist');
      cy.contains('Front').should('exist');
      cy.contains(testColor).should('exist');
      cy.contains(testSizes).should('exist');
      cy.contains('₹25,000 – ₹50,000').should('exist');
      cy.contains(testCustomization).should('exist');
      cy.contains('View Artwork').should('exist');
    });
  });

  it('Step 3: Registered customer submits inquiry and is automatically identified as REGISTERED', () => {
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/get-quote');

    const regCompany = `Reg Corp ${Date.now()}`;
    cy.get('[data-cy="company-name-input"]').type(regCompany);
    cy.get('[data-cy="contact-name-input"]').type('Rahul Sharma Registered');
    cy.get('[data-cy="phone-input"]').type('9123456789');
    cy.get('[data-cy="category-select"]').select('Hoodies & Sweatshirts');
    cy.get('[data-cy="quantity-input"]').focus().type('{selectall}75');

    cy.get('[data-cy="submit-inquiry-btn"]').click();

    cy.wait('@postInquiry', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      expect(interception.response?.body.customerType).to.eq('REGISTERED');
    });

    cy.contains(/Inquiry submitted successfully/i).should('be.visible');
  });
});
