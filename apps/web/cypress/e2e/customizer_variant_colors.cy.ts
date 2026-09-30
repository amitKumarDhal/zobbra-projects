/// <reference types="cypress" />

/**
 * Regression: changing the main product color must not overwrite variant rows the customer
 * configured. The customizer no longer has a quantity/variant editor, so configured rows arrive
 * through a resumed draft; the pricing preview and the submitted quote payload must carry them.
 */
const SLUG = 'classic-corporate-polo-tshirt';
const MOQ = 20; // seeded MOQ for the polo

const EXPECTED_ROWS = [
  { color: 'Navy Blue', size: 'M', quantity: 8 },
  { color: 'Maroon', size: 'L', quantity: 12 },
];

/** Seed a draft with configured variant rows, then open the customizer resuming from it. */
const visitWithConfiguredRows = () => {
  cy.request(`http://localhost:5000/api/v1/products/${SLUG}`).then((res) => {
    const product = res.body.product || res.body.data || res.body;
    const draft = {
      draftId: 'draft_variant_rows_test',
      productId: product.id,
      productName: product.name,
      selectedColor: 'White',
      collarColor: 'Yellow',
      quantity: MOQ,
      printPosition: 'Front Only',
      variants: EXPECTED_ROWS,
      timestamp: Date.now(),
    };
    cy.visit(`/products/${SLUG}/customize?resume=1`, {
      onBeforeLoad(win) {
        win.localStorage.setItem(`zobbra_customizer_draft_v1_${product.id}`, JSON.stringify(draft));
      },
    });
  });
  cy.contains('Restored your saved design draft').should('be.visible');
  cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
};

describe('Customizer - variant colors survive main color changes', () => {
  let pricingBodies: any[] = [];

  beforeEach(() => {
    pricingBodies = [];
    cy.login('customer@zobra.test', 'customer123');
    cy.intercept('POST', '**/api/v1/quotes/pricing-preview', (req) => {
      pricingBodies.push(req.body);
    }).as('pricing');
    cy.intercept('POST', '**/api/v1/quotes', {
      statusCode: 201,
      body: { success: true, quote: { id: 'test-quote' } },
    }).as('createQuote');
  });

  it('desktop: configured rows keep their colors in pricing and the quote payload', () => {
    cy.viewport(1280, 800);
    visitWithConfiguredRows();

    // Change the main product color twice
    cy.get('#tab-tool-colors').click();
    cy.get('button[title="Royal Blue"]').first().click();
    cy.get('button[title="Bottle Green"]').first().click();
    cy.get('button[title="Bottle Green"]').first().should('have.attr', 'aria-pressed', 'true');

    // Pricing preview (computed in the background, not displayed) carries the configured rows
    cy.wrap(null).should(() => {
      const last = pricingBodies[pricingBodies.length - 1];
      expect(last, 'latest pricing-preview body').to.exist;
      expect(last.quantity).to.eq(MOQ);
      expect(last.variants).to.deep.eq(EXPECTED_ROWS);
    });

    // Submit: payload keeps the rows, main color reflects the selector, quantities sum correctly
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.wait('@createQuote').its('request.body').then((body: any) => {
      expect(body.color).to.eq('Bottle Green');
      expect(body.quantity).to.eq(MOQ);
      expect(body.items).to.have.length(1);
      expect(body.items[0].variants).to.deep.eq(EXPECTED_ROWS);
      expect(body.items[0].quantity).to.eq(MOQ);
      const sum = body.items[0].variants.reduce((s: number, v: any) => s + v.quantity, 0);
      expect(sum).to.eq(body.quantity);
      expect(JSON.parse(body.customizationRequirements).variants).to.deep.eq(EXPECTED_ROWS);
      expect(JSON.stringify(body)).to.not.include('data:image/');
    });
  });

  it('desktop: the untouched default row still follows the main color', () => {
    cy.viewport(1280, 800);
    cy.visit(`/products/${SLUG}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
    cy.get('#tab-tool-colors').click();
    cy.get('button[title="Maroon"]').first().click();
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.wait('@createQuote').its('request.body').then((body: any) => {
      expect(body.color).to.eq('Maroon');
      expect(body.items[0].variants).to.have.length(1);
      expect(body.items[0].variants[0].color).to.eq('Maroon');
      expect(body.items[0].variants[0].quantity).to.eq(MOQ);
    });
  });

  it('mobile: configured rows keep their colors; rapid side switching is safe', () => {
    cy.viewport(390, 844);
    visitWithConfiguredRows();

    cy.get('#tab-tool-colors').click();
    cy.get('button[title="Royal Blue"]').first().click();

    // Rapid side switching on mobile, then the toggle and canvas agree
    cy.window().then((win: any) => win.__getCanvasRef().addText('M-FRONT', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' }));
    cy.document().then((doc) => {
      (doc.getElementById('btn-switch-back') as HTMLButtonElement).click();
      (doc.getElementById('btn-switch-front') as HTMLButtonElement).click();
      (doc.getElementById('btn-switch-back') as HTMLButtonElement).click();
    });
    cy.get('#btn-switch-back').should('have.class', 'bg-white');
    cy.window().should((win: any) => {
      const st = win.__getCanvasRef().getCanvasState();
      expect(st.hasFront).to.eq(true);
      expect(JSON.parse(st.frontJson).objects.map((o: any) => o.text)).to.deep.eq(['M-FRONT']);
      expect(st.hasBack).to.eq(false);
    });

    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.wait('@createQuote').its('request.body').then((body: any) => {
      expect(body.color).to.eq('Royal Blue');
      expect(body.items[0].variants).to.deep.eq(EXPECTED_ROWS);
    });
  });
});
