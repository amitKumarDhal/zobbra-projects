/// <reference types="cypress" />

describe('Customizer — Quote Payload Sanitization & Cloudinary Upload', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.login('customer@zobra.test', 'customer123');

    // Intercept GET requests for mock Cloudinary images with CORS headers
    cy.intercept('GET', 'https://res.cloudinary.com/**', (req) => {
      req.reply({
        statusCode: 200,
        headers: {
          'content-type': 'image/png',
          'access-control-allow-origin': '*',
        },
        body: Cypress.Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64'
        ),
      });
    });
  });

  it('A-E: Uploads artwork, ensures CDN URL in canvas state, sanitizes payload <100 KB, and successfully submits quote', () => {
    // Intercept quote creation
    cy.intercept('POST', '**/api/v1/quotes').as('submitQuote');

    // Intercept Cloudinary uploads to mock reliable CDN responses
    cy.intercept('POST', 'https://api.cloudinary.com/**', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          secure_url: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790000000/zobbra/designs/sample_logo.png',
          public_id: 'zobbra/designs/sample_logo',
          format: 'png',
          width: 500,
          height: 500,
        },
      });
    }).as('cloudinaryUpload');

    cy.visit('/products/prod-polo-200gsm/customize');
    cy.url().should('include', '/customize');

    // Wait for canvas to be fully ready
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 15000 }).should('exist');

    // 1. Switch to Logo tab
    cy.get('#tab-tool-logo').click();

    // 2. Upload artwork file
    cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });

    // 3. Verify Cloudinary upload was called
    cy.wait('@cloudinaryUpload');

    // 4. Change color
    cy.get('#tab-tool-colors').click();
    cy.get('button[title="Charcoal Black"]').first().click();

    // 5. Select quantity tier 50
    cy.contains('button', '50').click();

    // 6. Wait for submit button to be enabled and ready
    cy.get('#customizer-proceed-btn').should('not.be.disabled');
    cy.get('#customizer-proceed-btn').should('contain', 'Submit Quote Request');

    // 7. Click Submit Quote Request
    cy.get('#customizer-proceed-btn').click();

    // 8. Intercept and inspect outgoing payload
    cy.wait('@submitQuote').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);

      const reqBody = interception.request.body;
      const payloadString = JSON.stringify(reqBody);
      const payloadSize = new Blob([payloadString]).size;

      // Log diagnostics according to spec (Requirement 11)
      cy.log(`[Diagnostic] Payload byte size: ${payloadSize}`);
      cy.log(`[Diagnostic] Contains data:image: ${payloadString.includes('data:image/')}`);

      // Assertions
      expect(payloadString).not.to.include('data:image/');
      expect(payloadSize).to.be.lessThan(102400); // Must be comfortably under 100 KB Express limit
      expect(payloadSize).to.be.lessThan(15000); // Expecting ~3-6 KB compact payload

      // Cloudinary URLs only
      expect(reqBody.artworkUrl).to.be.a('string');
      expect(reqBody.artworkUrl).to.include('res.cloudinary.com');

      // Sanitized canvas state contains Cloudinary CDN URL, zero base64
      const canvasState = JSON.parse(reqBody.canvasStateJson);
      expect(JSON.stringify(canvasState)).not.to.include('data:image/');
      expect(JSON.stringify(canvasState)).to.include('res.cloudinary.com');
    });

    // 9. Verify redirected to My Quotes
    cy.url().should('include', '/customer/quotes');
  });

  it('F: Disables submit button and displays "Uploading artwork…" while Cloudinary upload is pending', () => {
    // Intercept Cloudinary upload with artificial delay
    cy.intercept('POST', 'https://api.cloudinary.com/**', (req) => {
      req.on('response', (res) => {
        res.setDelay(2000);
      });
      req.reply({
        statusCode: 200,
        body: {
          secure_url: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790000000/zobbra/designs/delayed_logo.png',
        },
      });
    }).as('delayedCloudinaryUpload');

    cy.visit('/products/prod-polo-200gsm/customize');
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 15000 }).should('exist');

    cy.get('#tab-tool-logo').click();

    // Upload file
    cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });

    // Verify button is disabled and shows "Uploading artwork…"
    cy.get('#customizer-proceed-btn').should('be.disabled');
    cy.get('#customizer-proceed-btn').should('contain', 'Uploading artwork…');

    // Wait for upload to complete
    cy.wait('@delayedCloudinaryUpload');

    // After upload finishes, button is enabled
    cy.get('#customizer-proceed-btn').should('not.be.disabled');
    cy.get('#customizer-proceed-btn').should('contain', 'Submit Quote Request');
  });

  it('G: Displays retryable error and blocks submission if Cloudinary upload fails', () => {
    // Intercept Cloudinary upload with failure
    cy.intercept('POST', 'https://api.cloudinary.com/**', {
      statusCode: 500,
      body: { error: { message: 'Cloudinary upload simulation failed' } },
    }).as('failedCloudinaryUpload');

    cy.visit('/products/prod-polo-200gsm/customize');
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 15000 }).should('exist');

    cy.get('#tab-tool-logo').click();

    // Upload file
    cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });

    cy.wait('@failedCloudinaryUpload');

    // Verify error is shown
    cy.contains('failed', { matchCase: false }).should('be.visible');

    // Proceed button should not submit a broken base64 quote
    cy.get('#customizer-proceed-btn').click();
    cy.url().should('not.include', '/customer/quotes');
  });

  it('H: Cloudinary image rehydration across side switch (Front → Back → Front), canvas export, and no SecurityError', () => {
    cy.intercept('POST', '**/api/v1/quotes').as('submitQuoteH');
    cy.intercept('POST', 'https://api.cloudinary.com/**', {
      statusCode: 200,
      body: {
        secure_url: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790000000/zobbra/designs/rehydrated_logo.png',
        public_id: 'zobbra/designs/rehydrated_logo',
        format: 'png',
        width: 500,
        height: 500,
      },
    }).as('uploadH');

    cy.visit('/products/prod-polo-200gsm/customize');
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 15000 }).should('exist');

    // 1. Upload logo on Front side
    cy.get('#tab-tool-logo').click();
    cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });
    cy.wait('@uploadH');

    // 2. Switch Front → Back
    cy.get('#btn-switch-back').click();
    cy.wait(300);

    // 3. Switch Back → Front (triggers loadFromJSON to rehydrate Cloudinary image from saved JSON)
    cy.get('#btn-switch-front').click();
    cy.wait(300);

    // 4. Configure quantity and submit
    cy.contains('button', '50').click();
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();

    // 5. Verify no SecurityError / tainted canvas and successful quote creation
    cy.wait('@submitQuoteH').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      const reqBody = interception.request.body;
      const payloadString = JSON.stringify(reqBody);

      // Assertions
      expect(payloadString).not.to.include('data:image/');
      expect(reqBody.artworkUrl).to.include('res.cloudinary.com');

      const canvasState = JSON.parse(reqBody.canvasStateJson);
      expect(JSON.stringify(canvasState)).not.to.include('data:image/');
      expect(JSON.stringify(canvasState)).to.include('rehydrated_logo.png');
      const frontState = JSON.parse(canvasState.front);
      expect(frontState.objects[0].src).to.include('rehydrated_logo.png');
      expect(frontState.objects[0].crossOrigin).to.eq('anonymous');
    });

    cy.url().should('include', '/customer/quotes');
  });
});
