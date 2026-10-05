/// <reference types="cypress" />

describe('Phase 6 Real-Browser Customizer Validation', () => {
  let createdQuoteId = '';
  let fullProductSlug = 'phase6-val-full-e2e';
  let disabledProductSlug = 'phase6-val-disabled-e2e';
  let fullProductId = '';
  let disabledProductId = '';

  const browserErrors: string[] = [];

  before(() => {
    // 1. Create isolated test products
    cy.exec('node ../../server/scripts/phase6_fixtures.js create').then((res) => {
      const data = JSON.parse(res.stdout.trim());
      fullProductId = data.fullProduct.id;
      disabledProductId = data.disabledProduct.id;
      fullProductSlug = data.fullProduct.slug;
      disabledProductSlug = data.disabledProduct.slug;
    });
  });

  after(() => {
    // Clean up isolated test data
    cy.exec('node ../../server/scripts/phase6_fixtures.js cleanup');
  });

  beforeEach(() => {
    browserErrors.length = 0;
    cy.viewport(1280, 850);

    // Monitor for console errors & unhandled exceptions
    cy.on('window:before:load', (win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });

    // Mock Cloudinary uploads to be fast and deterministic in tests
    cy.intercept('POST', 'https://api.cloudinary.com/**', {
      statusCode: 200,
      body: {
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zobbra/designs/mock-preview.png',
        public_id: 'zobbra/mock-preview',
      },
    }).as('cloudinaryUpload');
  });

  it('A-D: Verified full customizer flow (Branding selector, Taping color, Front/Back indicators, OrderReviewSheet & Canonical Quote Payload)', () => {
    cy.loginAsCustomer();

    cy.intercept('POST', '**/api/v1/quotes').as('submitQuote');

    // Visit full featured product customizer
    cy.visit(`/products/${fullProductSlug}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');

    // 1. Tool panel: Colors
    cy.get('#tab-tool-colors').should('be.visible').click();

    // Verify Branding Method selector is VISIBLE and interactive
    cy.get('[data-cy="branding-method-selector"]').should('be.visible');
    cy.get('[data-cy="branding-method-print"]').should('be.visible');
    cy.get('[data-cy="branding-method-embroidery"]').should('be.visible');

    // Select Embroidery
    cy.get('[data-cy="branding-method-embroidery"]').click();
    cy.get('[data-cy="branding-method-embroidery"]').should('have.class', 'bg-white');

    // Verify Taping Color selector is VISIBLE
    cy.get('[data-cy="taping-color-section"]').should('be.visible');
    cy.get('[data-cy="customizer-taping-colors"]').should('be.visible');

    // Select a specific taping color
    cy.get('[data-cy="customizer-taping-colors"] button[title="Charcoal Black"]').first().click();

    // Verify Collar / Rib color selector is VISIBLE and select Navy Blue
    cy.get('[data-cy="customizer-collar-colors"] button[title="Navy Blue"]').first().click();

    // Verify Front/Back switcher indicators
    cy.get('[data-cy="switcher-color-indicator-front"]').should('be.visible');
    cy.get('[data-cy="switcher-color-indicator-back"]').should('be.visible');

    // Switch to BACK and verify state preservation
    cy.get('#btn-switch-back').click();
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]').should('exist');
    cy.get('#btn-switch-front').click();
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]').should('exist');

    // Proceed to OrderReviewSheet
    cy.get('#customizer-proceed-btn').should('be.visible').click();

    // Verify OrderReviewSheet UI items (Req 3)
    cy.get('#customizer-review-sheet').should('be.visible');
    cy.get('[data-cy="review-body-color"]').should('be.visible');
    cy.get('[data-cy="review-collar-color"]').should('be.visible');
    cy.get('[data-cy="review-taping-color"]').should('be.visible').and('contain', 'Charcoal Black');
    cy.get('[data-cy="review-branding-method"]').should('be.visible').and('contain', 'Embroidery');

    // Confirm & submit quote
    cy.get('#customizer-confirm-btn').should('not.be.disabled').click();

    // Wait for the quote submission request and verify canonical payload fields (Req 1, 2)
    cy.wait('@submitQuote').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      const req = interception.request.body;

      // Canonical payload assertions
      expect(req.printingType).to.eq('Embroidery');
      expect(req.printType).to.eq('Embroidery Logo');
      expect(req.embroidery).to.eq(true);
      expect(req.tapingColor).to.eq('Charcoal Black');

      // Structured customizationRequirements JSON
      const parsedReqs = JSON.parse(req.customizationRequirements);
      expect(parsedReqs.brandingMethod).to.eq('Embroidery');
      expect(parsedReqs.embroidery).to.eq(true);
      expect(parsedReqs.tapingColor).to.eq('Charcoal Black');
      expect(parsedReqs.collarColor).to.exist;

      // Store created quote id for admin inspection
      createdQuoteId = interception.response?.body?.quote?.id || interception.response?.body?.id;
      expect(createdQuoteId).to.be.a('string');
    });
  });

  it('A & B: Disabled features product hides Branding Method and Taping Color selectors', () => {
    cy.loginAsCustomer();

    cy.visit(`/products/${disabledProductSlug}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');

    // Open Colors panel
    cy.get('#tab-tool-colors').should('be.visible').click();

    // Verify Branding Method selector is HIDDEN
    cy.get('[data-cy="branding-method-selector"]').should('not.exist');

    // Verify Taping Color selector is HIDDEN
    cy.get('[data-cy="taping-color-section"]').should('not.exist');

    // Proceed to OrderReviewSheet
    cy.get('#customizer-proceed-btn').should('be.visible').click();

    // Verify OrderReviewSheet does NOT show taping color
    cy.get('[data-cy="review-taping-color"]').should('not.exist');

    // Branding method is hidden when disabled
    cy.get('[data-cy="review-branding-method"]').should('not.exist');
  });

  it('E: Admin quote details shows structured Customizer Specifications card', () => {
    expect(createdQuoteId, 'Quote ID must exist from previous test').to.not.be.empty;

    // Login as Admin
    cy.login('admin@zobra.test', 'admin123');
    cy.url().should('include', '/dashboard');

    // Intercept quote detail API request
    cy.intercept('GET', `**/api/v1/quotes/${createdQuoteId}`).as('getQuoteDetail');

    // Visit admin quote detail
    cy.visit(`/dashboard/quotes/${createdQuoteId}`);
    cy.wait('@getQuoteDetail', { timeout: 15000 });

    // Verify Customizer Specifications card (Req 5)
    cy.get('[data-cy="quote-customizer-specifications"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="spec-template"]').should('contain', 'polo-v1');
    cy.get('[data-cy="spec-body-color"]').should('be.visible');
    cy.get('[data-cy="spec-collar-color"]').should('contain', 'Navy Blue');
    cy.get('[data-cy="spec-taping-color"]').should('contain', 'Charcoal Black');
    cy.get('[data-cy="spec-branding-method"]').should('contain', 'Embroidery');
  });

  it('F: Server security rejects spoofed disabled embroidery & taping submissions', () => {
    cy.customerSession().then((session) => {
      // 1. Attempt spoofed embroidery on disabled product
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/quotes',
        headers: { Authorization: `Bearer ${session.token}` },
        failOnStatusCode: false,
        body: {
          productId: disabledProductId,
          quantity: 50,
          color: 'White',
          printingType: 'Embroidery',
          embroidery: true,
          items: [{ productId: disabledProductId, quantity: 50, color: 'White', printingType: 'Embroidery', embroidery: true }],
        },
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.message).to.match(/embroidery.*disabled/i);
      });

      // 2. Attempt spoofed taping color on disabled product
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/quotes',
        headers: { Authorization: `Bearer ${session.token}` },
        failOnStatusCode: false,
        body: {
          productId: disabledProductId,
          quantity: 50,
          color: 'White',
          tapingColor: 'Charcoal Black',
          items: [{ productId: disabledProductId, quantity: 50, color: 'White', tapingColor: 'Charcoal Black' }],
        },
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.message).to.match(/taping.*disabled/i);
      });
    });
  });
});
