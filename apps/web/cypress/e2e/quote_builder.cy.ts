describe('Phase 2 — Interactive Quote Builder E2E', () => {
  it('navigates through the multi-step merchandise quote builder wizard', () => {
    // 1. Login and Visit Customer Create Quote Wizard
    cy.login('customer@zobra.test', 'customer123');
    cy.visit('/customer/create-quote');
    cy.url().should('include', '/customer/create-quote');
    cy.contains('Create Your Merchandise Quote').should('be.visible');

    // Step 1: Product
    cy.contains('Step 1: Choose Product Category').should('be.visible');
    cy.contains('Cotton Caps (3D Embroidered)').click();
    cy.contains('button', 'NEXT STEP').click();

    // Step 2: Color
    cy.contains('Step 2: Choose Fabric Color').should('be.visible');
    cy.contains('button', 'Charcoal Black').click();

    // Test Back button navigation
    cy.contains('button', 'BACK').click();
    cy.contains('Step 1: Choose Product Category').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();
    cy.contains('Step 2: Choose Fabric Color').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();

    // Step 3: Fabric
    cy.contains('Step 3: Choose Fabric Spec').should('be.visible');
    cy.contains('240 GSM Heavy Weight Cotton').click();
    cy.contains('button', 'NEXT STEP').click();

    // Step 4: Size Breakdown
    cy.contains('Step 4: Size Breakdown').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();

    // Step 5: Print Position
    cy.contains('Step 5: Print Position & Technique').should('be.visible');
    cy.contains('button', 'Back Full Print').click();
    cy.contains('button', 'NEXT STEP').click();

    // Step 6: Artwork File Upload UI
    cy.contains('Step 6: Upload Logo File & Artwork').should('be.visible');
    cy.contains('ATTACH SAMPLE FILE').click();
    cy.contains('Attached: brand_logo_highres.vector').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();

    // Step 7: Configurator Summary
    cy.contains('Step 7: Configurator Summary & Specifications').should('be.visible');
    cy.contains('Configurator Summary').should('be.visible');
    cy.contains('button', 'NEXT STEP').click();

    // Step 8: Delivery & GSTIN Details
    cy.contains('Step 8: Delivery Address & GSTIN Details').should('be.visible');
    cy.get('input[value*="21AAACA1234A1Z5"]').should('exist');
    cy.contains('button', 'SUBMIT QUOTE').click();

    // Verification of Submission Success UI
    cy.contains('Configurator Quote Submitted!').should('be.visible');
    cy.contains('ZQB-').should('be.visible');
  });
});
