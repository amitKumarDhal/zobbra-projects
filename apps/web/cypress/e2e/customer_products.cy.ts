/// <reference types="cypress" />

describe('Customer Product Discovery Catalog UX (/customer/products)', () => {
  // Isolated throwaway customer (OTP-equivalent session via the e2e task), removed in after().
  // The spec no longer depends on a pre-existing account in the local database.
  const customerEmail = `catalog-e2e-${Date.now()}@zobra.test`;
  const customerPassword = 'unused-otp-login';
  let customerToken = '';
  let customerUser: any = null;

  before(() => {
    // 1. Create the customer and obtain a valid JWT & profile
    cy.task('e2eCreateCustomer', { name: 'Catalog E2E Customer', email: customerEmail }).then((res: any) => {
      expect(res.status).to.eq(201);
      customerToken = res.body.token;
      customerUser = res.body.user;
    });
  });

  after(() => {
    cy.task('e2eDeleteCustomer', { email: customerEmail });
  });

  const visitProducts = (path = '/customer/products') => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });
  };

  it('1. Login via UI & 2. Open /customer/products & 3. Products load', () => {
    // Customer UI login is WhatsApp OTP now; sign the seeded customer in via the API.
    cy.login(customerEmail, customerPassword);
    cy.url({ timeout: 10000 }).should('include', '/customer');

    // Open /customer/products
    visitProducts('/customer/products');

    // Verify page header
    cy.get('[data-cy="page-header-title"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'BROWSE PRODUCTS');
    cy.contains('Choose products for your next corporate order.').should('be.visible');

    // Verify Header CTAs
    cy.get('[data-cy="create-quote-header-btn"]').should('be.visible');
    cy.get('[data-cy="design-order-header-btn"]').should('be.visible');

    // Verify products grid loaded
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');
    cy.get('[data-cy^="product-card-"]').should('have.length.at.least', 1);

    // Verify B2B pricing and MOQ format on cards
    cy.get('[data-cy^="product-price-"]').first().should('be.visible').and('contain', 'From ₹');
    cy.get('[data-cy^="product-moq-"]').first().should('be.visible').and('contain', 'MOQ');
  });

  it('4. Search products with debounce', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    // Search for "Polo"
    cy.get('[data-cy="search-products-input"]').clear().type('Polo');

    // Allow debounce to execute
    cy.wait(1000);

    // Results should match search
    cy.get('[data-cy^="product-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('[data-cy^="product-name-"]').first().should('contain', 'Polo');

    // URL parameter reflects search
    cy.url().should('include', 'search=Polo');
  });

  it('5. Category filter using real database categories', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    // Select category dropdown
    cy.get('[data-cy="category-filter-select"]').select('apparel');

    cy.wait(1000);

    // URL parameter reflects category
    cy.url().should('include', 'category=apparel');
    cy.get('[data-cy="category-filter-select"]').should('have.value', 'apparel');
    cy.get('[data-cy="product-grid"]').should('be.visible');
  });

  it('6. Sort products (Price Low -> High, High -> Low, MOQ, Newest)', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    // Sort by price-asc
    cy.get('[data-cy="sort-select"]').select('price-asc');
    cy.wait(500);
    cy.url().should('include', 'sort=price-asc');

    // Sort by price-desc
    cy.get('[data-cy="sort-select"]').select('price-desc');
    cy.wait(500);
    cy.url().should('include', 'sort=price-desc');

    // Sort by moq-asc
    cy.get('[data-cy="sort-select"]').select('moq-asc');
    cy.wait(500);
    cy.url().should('include', 'sort=moq-asc');
  });

  it('7. Clear filter restores full catalog view', () => {
    visitProducts('/customer/products?search=NonExistentProductQuery12345');

    // Empty state should be visible
    cy.get('[data-cy="empty-state"]', { timeout: 10000 }).should('be.visible');
    cy.contains('No products found').should('be.visible');

    // Click CLEAR FILTERS button
    cy.get('[data-cy="clear-filters-btn"]').first().click();

    // Catalog should restore
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');
    cy.get('[data-cy^="product-card-"]').should('have.length.at.least', 1);
  });

  it('8. Cards no longer link to a separate product details page', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');
    cy.get('[data-cy^="product-card-"]').should('have.length.at.least', 1);
    cy.get('[data-cy^="details-btn-"]').should('not.exist');
  });

  it('9. Design Your Own button navigates to customizer', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    cy.get('[data-cy^="product-card-"]').first().within(() => {
      cy.get('[data-cy^="design-btn-"]').click();
    });

    // Should navigate to customizer /products/:id/customize
    cy.url({ timeout: 10000 }).should('include', '/customize');
  });

  it('10. Quick Quote link navigates to quote flow with preselected product', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    cy.get('[data-cy^="product-card-"]').first().within(() => {
      cy.get('[data-cy^="quick-quote-link-"]').click();
    });

    // Should navigate to /customer/create-quote?productId=...
    cy.url({ timeout: 10000 }).should('include', '/customer/create-quote?productId=');
  });

  it('11. Mobile viewport responsiveness and filter sheet', () => {
    cy.viewport('iphone-xr');
    visitProducts('/customer/products');

    // Header and search bar should fit without horizontal scrolling
    cy.get('[data-cy="page-header-title"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="search-products-input"]').should('be.visible');

    // Mobile filter trigger should be visible
    cy.get('[data-cy="mobile-filters-trigger"]').should('be.visible').click();

    // Filter sheet modal should open
    cy.contains('Filter Products').should('be.visible');
    cy.contains('Apply Filters').click();
  });

  it('12. Empty search result shows clear empty state', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    cy.get('[data-cy="search-products-input"]').clear().type('ZobraXYZImpossibleProductMatch');

    cy.wait(1000);

    // Empty state should be visible
    cy.get('[data-cy="empty-state"]', { timeout: 10000 }).should('be.visible');
    cy.contains('No products found').should('be.visible');
    cy.contains('Try removing a filter or searching for another product.').should('be.visible');
    cy.get('[data-cy="clear-filters-btn"]').should('be.visible');
  });
});
