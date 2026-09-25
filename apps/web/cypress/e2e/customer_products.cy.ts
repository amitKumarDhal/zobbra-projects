/// <reference types="cypress" />

describe('Customer Product Discovery Catalog UX (/customer/products)', () => {
  const customerEmail = 'ajay@gmail.com';
  const customerPassword = '123456';
  let customerToken = '';
  let customerUser: any = null;

  before(() => {
    // 1. Authenticate customer via API to obtain valid JWT & profile
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/login',
      body: {
        email: customerEmail,
        password: customerPassword,
      },
    }).then((res) => {
      expect(res.status).to.eq(200);
      customerToken = res.body.token;
      customerUser = res.body.user;
    });
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
    // UI Login journey
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').should('be.visible').clear().type(customerEmail);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(customerPassword);
    cy.wait(500);
    cy.get('[data-cy="login-submit-button"]').click();
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

  it('8. Open product details', () => {
    visitProducts('/customer/products');
    cy.get('[data-cy="product-grid"]', { timeout: 12000 }).should('be.visible');

    cy.get('[data-cy^="product-card-"]').first().within(() => {
      cy.get('[data-cy^="details-btn-"]').click();
    });

    // Should navigate to product detail page /products/:id
    cy.url({ timeout: 10000 }).should('match', /\/products\/[a-zA-Z0-9_-]+/);
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
