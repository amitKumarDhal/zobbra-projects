/// <reference types="cypress" />

/**
 * Real end-to-end catalog sync, driven through the UI:
 *   Admin creates a product (/dashboard/products/new, real Cloudinary image upload)
 *     → admin list → public/customer catalog → detail → product-specific customizer.
 * A second, hidden product must never reach the customer side.
 * Both products are deleted afterwards so the dev catalog is left unchanged.
 */
const API = 'http://localhost:5000/api/v1';
const RUN = Date.now();
const ACTIVE = { name: `DEV SYNC TEST PRODUCT ${RUN}`, sku: `dev-sync-test-product-${RUN}` };
const HIDDEN = { name: `DEV SYNC HIDDEN PRODUCT ${RUN}`, sku: `dev-sync-hidden-product-${RUN}` };
const CUSTOMER_EMAIL = `sync-${RUN}@zobra.test`;

let adminToken = '';
let activeProduct: any = null;
let hiddenProduct: any = null;

const adminLogin = () =>
  cy.request('POST', `${API}/auth/login`, { email: 'admin@zobra.test', password: 'admin123' }).then((res) => {
    adminToken = res.body.token;
    cy.window().then((win) => {
      win.localStorage.setItem('token', res.body.token);
      win.localStorage.setItem('zobra_token', res.body.token);
      win.localStorage.setItem('user', JSON.stringify(res.body.user));
      win.localStorage.setItem('zobra_user', JSON.stringify(res.body.user));
    });
  });

/** Fill and submit the real admin Add Product form. */
const createViaAdminForm = (p: { name: string; sku: string }, active: boolean, withImage: boolean) => {
  cy.visit('/dashboard/products/new');
  cy.get('input[placeholder="e.g. Classic Promotional Structured Cotton Cap"]').clear().type(p.name);
  cy.get('input[placeholder="e.g. classic-cotton-cap"]').clear().type(p.sku);
  cy.contains('label', 'Category *').parent().find('select').should('not.contain', 'Loading').select('Caps & Headwear');
  cy.get('input[placeholder="149"]').clear().type('299');
  cy.contains('button', active ? 'Active' : 'Draft').click();
  cy.get('textarea').first().clear().type('Created by the admin→customer catalog sync E2E test.');
  // A cap is one-size
  cy.get('[data-cy="requires-size"]').uncheck();
  // One quantity range (also the MOQ)
  cy.get('[data-cy="add-range"]').click();
  cy.get('[data-cy="range-minQuantity"]').last().clear().type('20');
  cy.get('[data-cy="range-pricePerUnit"]').last().clear().type('299');
  if (withImage) {
    cy.intercept('POST', 'https://api.cloudinary.com/**').as('cloudinaryUpload');
    cy.get('[data-cy="product-image-file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });
    cy.wait('@cloudinaryUpload', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
    cy.contains(/Product Images \(1\)/).should('exist');
  }
  cy.intercept('POST', `${API}/products`).as('createProduct');
  cy.get('button[type="submit"]').click();
  return cy.wait('@createProduct').then(({ response }) => {
    expect(response?.statusCode).to.eq(201);
    return response!.body.product;
  });
};

describe('Admin → customer product catalog sync (real UI flow)', () => {
  before(() => {
    cy.visit('/');
    adminLogin();
    createViaAdminForm(ACTIVE, true, true).then((p) => (activeProduct = p));
    cy.url().should('include', '/dashboard/products');
    createViaAdminForm(HIDDEN, false, false).then((p) => (hiddenProduct = p));
  });

  after(() => {
    cy.task('e2eDeleteCustomer', { email: CUSTOMER_EMAIL });
    for (const p of [activeProduct, hiddenProduct]) {
      if (p?.id) {
        cy.request({
          method: 'DELETE',
          url: `${API}/products/${p.id}`,
          headers: { Authorization: `Bearer ${adminToken}` },
          failOnStatusCode: false,
        });
      }
    }
  });

  it('F: persisted DB record has the admin data (slug, image, status, category, price, MOQ)', () => {
    expect(activeProduct.slug).to.eq(ACTIVE.sku);
    expect(activeProduct.isActive).to.eq(true);
    expect(activeProduct.category.slug).to.eq('caps');
    expect(activeProduct.basePrice).to.eq(299);
    expect(activeProduct.images).to.have.length(1);
    expect(activeProduct.images[0]).to.match(/^https:\/\/res\.cloudinary\.com\//);
    expect(activeProduct.bulkPricing.length).to.be.greaterThan(0);
    expect(hiddenProduct.isActive).to.eq(false);
  });

  it('A: admin products list shows both new products with the right status', () => {
    cy.visit('/');
    adminLogin();
    cy.visit('/dashboard/products');
    cy.get('select').filter(':has(option:contains("All Status"))').first().select('All Status');
    cy.get('input[placeholder*="Search"]').first().type('DEV SYNC');
    cy.contains('tr', ACTIVE.name).should('be.visible');
    cy.contains('tr', HIDDEN.name).should('be.visible');
  });

  it('B/E: public catalog shows the active product with the admin-uploaded image, not the hidden one', () => {
    cy.clearLocalStorage();
    cy.visit('/products');
    cy.get(`[data-cy="product-card-${ACTIVE.sku}"]`, { timeout: 15000 })
      .should('be.visible')
      .within(() => {
        cy.contains(ACTIVE.name).should('be.visible');
        cy.get('[data-cy="product-card-image"]').should('have.attr', 'src', activeProduct.images[0]);
        cy.contains('₹299').should('be.visible');
      });
    cy.contains(HIDDEN.name).should('not.exist');
  });

  it('C/D: the old product link redirects to the customizer; Customize opens the cap customizer', () => {
    cy.visit(`/products/${activeProduct.id}`);
    cy.location('pathname', { timeout: 15000 }).should('eq', `/products/${activeProduct.id}/customize`);
    cy.contains(ACTIVE.name).should('be.visible');

    cy.visit('/products');
    cy.get(`[data-cy="product-card-${ACTIVE.sku}"]`, { timeout: 15000 }).contains('button', 'CUSTOMIZE').click();
    cy.location('pathname').should('eq', `/products/${activeProduct.id}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
    cy.contains(ACTIVE.name).should('be.visible');
    // Product-specific template: cap colors, not the T-shirt body/collar controls
    cy.get('#tab-tool-colors').click();
    cy.contains('CROWN COLOR').should('be.visible');
    cy.contains('BODY COLOR').should('not.exist');
  });

  it('G/H: survives refresh and a brand-new session; hidden product detail is not reachable', () => {
    cy.visit('/products');
    cy.get(`[data-cy="product-card-${ACTIVE.sku}"]`, { timeout: 15000 }).should('be.visible');
    cy.reload();
    cy.get(`[data-cy="product-card-${ACTIVE.sku}"]`, { timeout: 15000 }).should('be.visible');

    cy.clearAllLocalStorage();
    cy.clearAllCookies();
    cy.clearAllSessionStorage();
    cy.visit(`/products/${ACTIVE.sku}`);
    cy.contains(ACTIVE.name, { timeout: 15000 }).should('be.visible');

    cy.request({ url: `${API}/products/${hiddenProduct.slug}`, failOnStatusCode: false }).its('status').should('eq', 404);
    cy.request({ url: `${API}/products?status=All%20Status&search=DEV%20SYNC&pageSize=100` })
      .its('body.data')
      .then((rows: any[]) => {
        expect(rows.map((r) => r.id)).to.include(activeProduct.id);
        expect(rows.map((r) => r.id)).to.not.include(hiddenProduct.id);
      });
  });

  it('customer catalog (/customer/products) lists the same active DB product and not the hidden one', () => {
    cy.task('e2eCreateCustomer', { name: 'Sync Test Customer', email: CUSTOMER_EMAIL }).then((result: any) => {
      const { token, user } = result.body;
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('zobra_token', token);
        win.localStorage.setItem('user', JSON.stringify(user));
        win.localStorage.setItem('zobra_user', JSON.stringify(user));
      });
      // A customer token cannot create products
      cy.request({
        method: 'POST',
        url: `${API}/products`,
        headers: { Authorization: `Bearer ${token}` },
        body: { name: 'nope', categoryId: activeProduct.categoryId, basePrice: 1, description: 'x' },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
    });
    cy.visit('/customer/products');
    cy.contains(ACTIVE.name, { timeout: 15000 }).should('exist');
    cy.contains(HIDDEN.name).should('not.exist');
  });
});
