describe('ZOBBRA Product-Level Customizer System (Step 22 Real UI Test)', () => {
  const productId = 'f9f3a0bf-2000-4627-b04e-a1c9de480cbe';

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Phase 1: Admin enables Customizer with Polo template and saves', () => {
    cy.login('admin@zobra.test', 'admin123');

    // Open Edit Product
    cy.visit(`/dashboard/products/${productId}/edit`);
    cy.get('[data-cy="section-designer"]').scrollIntoView();

    // Verify Customizer toggle is ON or turn it ON
    cy.get('[data-cy="customizer-enabled-toggle"]').then(($toggle) => {
      if (!$toggle.is(':checked')) {
        cy.wrap($toggle).check({ force: true });
      }
    });

    // Select Polo template
    cy.get('[data-cy="customizer-template-select"]').should('be.visible').select('polo-v1');
    cy.get('[data-cy="customizer-template-preview"]').should('be.visible').and('contain', 'Polo T-Shirt');

    // Save product
    cy.get('[data-cy="product-submit"]').click();
    cy.url().should('include', '/dashboard/products');
  });

  it('Phase 2: Customer Product Detail shows Customize, opens customizer, recolors and proceeds', () => {
    // Visit Product Detail
    cy.visit(`/products/${productId}`);
    cy.contains('DEV Recolor Polo').should('be.visible');

    // Step 7: [ CUSTOMIZE ] button IS visible
    cy.get('[data-cy="product-detail-customize"]').should('be.visible').and('contain', 'CUSTOMIZE');

    // Click Customize
    cy.get('[data-cy="product-detail-customize"]').click();
    cy.url().should('include', `/products/${productId}/customize`);

    // Verify customizer loads
    cy.get('[data-cy="customizer-canvas-container"]', { timeout: 20000 }).should('be.visible');

    // Verify Proceed button is present
    cy.get('#customizer-proceed-btn').should('be.visible');
  });

  it('Phase 3: Admin disables Customizer, Product Detail hides Customize, direct customizer URL is blocked', () => {
    cy.login('admin@zobra.test', 'admin123');

    // Open Edit Product
    cy.visit(`/dashboard/products/${productId}/edit`);
    cy.get('[data-cy="section-designer"]').scrollIntoView();

    // Turn OFF Customizer
    cy.get('[data-cy="customizer-enabled-toggle"]').uncheck({ force: true });
    cy.get('[data-cy="customizer-template-wrapper"]').should('not.exist');

    // Save Changes
    cy.get('[data-cy="product-submit"]').click();
    cy.url().should('include', '/dashboard/products');

    // Visit Customer Product Detail
    cy.visit(`/products/${productId}`);
    cy.contains('DEV Recolor Polo').should('be.visible');

    // Step 7: [ CUSTOMIZE ] button MUST NOT exist
    cy.get('[data-cy="product-detail-customize"]').should('not.exist');
    cy.contains('REQUEST A QUOTE').should('be.visible');

    // Step 8: Direct URL navigation is BLOCKED
    cy.visit(`/products/${productId}/customize`);
    cy.get('[data-cy="customizer-unavailable"]').should('be.visible');
    cy.contains('Customization is not available for this product.').should('be.visible');
    cy.get('[data-cy="customizer-back-to-product"]').should('be.visible').click();
    cy.url().should('include', `/products/${productId}`);
  });

  it('Phase 4: Admin re-enables Customizer, confirms template is preserved, saves and customization works again', () => {
    cy.login('admin@zobra.test', 'admin123');

    // Open Edit Product
    cy.visit(`/dashboard/products/${productId}/edit`);
    cy.get('[data-cy="section-designer"]').scrollIntoView();

    // Turn ON Customizer
    cy.get('[data-cy="customizer-enabled-toggle"]').check({ force: true });
    cy.get('[data-cy="customizer-template-wrapper"]').should('be.visible');

    // Step 2 & 22: Confirm template 'polo-v1' is STILL SELECTED!
    cy.get('[data-cy="customizer-template-select"]').should('have.value', 'polo-v1');

    // Save product
    cy.get('[data-cy="product-submit"]').click();
    cy.url().should('include', '/dashboard/products');

    // Visit Customer Product Detail
    cy.visit(`/products/${productId}`);
    cy.get('[data-cy="product-detail-customize"]').should('be.visible');
  });
});
