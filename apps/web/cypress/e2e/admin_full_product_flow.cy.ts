/// <reference types="cypress" />

/**
 * Full admin → customer product data flow, driven through the real UI against the local dev stack:
 *
 *   Admin "Add New Product" form (every section, real Cloudinary image/video uploads)
 *     → admin product list → admin edit (all data still present)
 *     → customer catalog → customer product detail → customizer → server-priced quote
 *     → customization off / inactive behaviour.
 *
 * The product is left in the dev catalog (as an Active product) so it can be inspected afterwards.
 */
const API = 'http://localhost:5000/api/v1';
const RUN = Date.now();
const FIX = 'cypress/fixtures/product-flow';

const P = {
  name: 'DEV FULL PRODUCT TEST',
  slug: `dev-full-product-test-${RUN}`,
  description: 'Development full-field test product',
  colors: ['Matte Black', 'Classic White', 'Navy Blue'],
  highlights: ['6-panel structured crown', 'Adjustable brass buckle', '3D puff embroidery ready'],
  giftTitle: 'Free sticker pack',
  addonTitle: 'Premium gift box',
};
const CUSTOMER_EMAIL = 'dev-product-flow-customer@zobra.test';

let adminToken = '';
let product: any = null;
let customerSession: { token: string; user: any } | null = null;

const setSession = (token: string, user: any) =>
  cy.window().then((win) => {
    win.localStorage.setItem('token', token);
    win.localStorage.setItem('zobra_token', token);
    win.localStorage.setItem('user', JSON.stringify(user));
    win.localStorage.setItem('zobra_user', JSON.stringify(user));
  });

const asAdmin = () => {
  cy.visit('/');
  cy.request('POST', `${API}/auth/login`, { email: 'admin@zobra.test', password: 'admin123' }).then((res) => {
    adminToken = res.body.token;
    setSession(res.body.token, res.body.user);
  });
};

const asCustomer = () => {
  cy.visit('/');
  cy.then(() => setSession(customerSession!.token, customerSession!.user));
};

const asGuest = () => {
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
};

const upload = (selector: string, file: string) => {
  cy.intercept('POST', 'https://api.cloudinary.com/**').as('cloudinary');
  cy.get(`[data-cy="${selector}"]`).selectFile(`${FIX}/${file}`, { force: true });
  cy.wait('@cloudinary', { timeout: 90000 }).its('response.statusCode').should('eq', 200);
};

const fill = (cy_: string, value: string | number) => cy.get(`[data-cy="${cy_}"]`).clear().type(String(value));

// `next dev` compiles a route on its first visit, so allow more than the 4s default per command.
describe('Admin → customer full product data flow (real UI)', { defaultCommandTimeout: 30000 }, () => {
  before(() => {
    // A reusable dev customer (stands in for a completed WhatsApp OTP sign-in)
    cy.task('e2eSessionForEmail', { email: CUSTOMER_EMAIL }).then((session: any) => {
      if (session) {
        customerSession = session;
        return;
      }
      cy.task('e2eCreateCustomer', { name: 'Dev Product Flow Customer', email: CUSTOMER_EMAIL }).then((result: any) => {
        customerSession = { token: result.body.token, user: result.body.user };
      });
    });

    // ------------------------------------------------------------------
    // ADMIN: create the product through the real Add New Product screen
    // ------------------------------------------------------------------
    asAdmin();
    cy.visit('/dashboard/products');
    cy.get('[data-cy="add-product-btn"]').click();
    cy.location('pathname').should('eq', '/dashboard/products/new');

    // Basic information
    fill('product-name', P.name);
    fill('product-slug', P.slug);
    fill('product-description', P.description);

    // Pricing & stock
    fill('product-base-price', 299);
    fill('product-moq', 10);
    fill('product-stock', 500);
    fill('product-sample-qty', 1);

    // Quantity range pricing: 10-49 = 299, 50-99 = 279, 100+ = 259
    const ranges: Array<[number, number | null, number]> = [
      [10, 49, 299],
      [50, 99, 279],
      [100, null, 259],
    ];
    ranges.forEach(([min, max, price]) => {
      cy.get('[data-cy="add-range"]').click();
      cy.get('[data-cy="range-minQuantity"]').last().clear().type(String(min));
      if (max) cy.get('[data-cy="range-maxQuantity"]').last().clear().type(String(max));
      else cy.get('[data-cy="range-maxQuantity"]').last().clear();
      cy.get('[data-cy="range-pricePerUnit"]').last().clear().type(String(price));
    });
    cy.get('[data-cy="pricing-range-row"]').should('have.length', 3);

    // Social proof
    fill('product-rating', 4.8);
    fill('product-review-count', 154);

    // Order type & settings
    cy.get('[data-cy="order-mode-BOTH"]').click();
    cy.get('[data-cy="product-category"]').should('not.contain', 'Loading').select('Caps & Headwear');
    cy.get('[data-cy="customization-enabled"]').should('be.checked');
    cy.contains('button', 'Active').click();

    // Sizes: a cap is one-size
    cy.get('[data-cy="requires-size"]').uncheck();

    // Colours
    P.colors.forEach((name) => {
      fill('color-name', name);
      cy.get('[data-cy="add-color"]').click();
    });
    cy.get('[data-cy="color-chip"]').should('have.length', 3);

    // Stock deduction (internal)
    cy.get('[data-cy="stock-enabled"]').check();
    cy.get('[data-cy="add-stock-type"]').click();
    cy.get('[data-cy="stock-type"]').last().type('Dark blank caps');
    cy.get('[data-cy="stock-type-qty"]').last().type('300');
    cy.get('[data-cy="stock-pool"]').last().within(() => {
      cy.get('[data-cy="stock-color-Matte Black"]').click();
      cy.get('[data-cy="stock-color-Navy Blue"]').click();
    });
    cy.get('[data-cy="add-stock-type"]').click();
    cy.get('[data-cy="stock-type"]').last().type('White blank caps');
    cy.get('[data-cy="stock-type-qty"]').last().type('200');
    cy.get('[data-cy="stock-pool"]').last().within(() => cy.get('[data-cy="stock-color-Classic White"]').click());

    // Designer
    cy.get('[data-cy="designer-enabled"]').should('be.checked');

    // Product images (3 real uploads)
    ['cap-black.jpg', 'cap-white.jpg', 'cap-navy.jpg'].forEach((file) => upload('product-image-file', file));
    cy.get('[data-cy="product-image-item"]').should('have.length', 3);

    // Recent order image
    upload('order-image-file', 'order-photo.jpg');
    cy.get('[data-cy="order-image-item"]').should('have.length', 1);

    // Product videos: upload two, then move the second to the top
    upload('video-file', 'video-a.mp4');
    upload('video-file', 'video-b.mp4');
    cy.get('[data-cy="video-item"]').should('have.length', 2);
    cy.get('[data-cy="video-item"]').last().find('[data-cy="video-move-up"]').click();

    // Free gift
    cy.get('[data-cy="gift-enabled"]').check();
    fill('gift-title', P.giftTitle);
    fill('gift-description', 'Included with every order');

    // Offer addon: ₹15 per piece
    cy.get('[data-cy="addon-enabled"]').check();
    fill('addon-title', P.addonTitle);
    fill('addon-price', 15);
    cy.get('[data-cy="addon-price-type"]').select('PER_PIECE');
    fill('addon-description', 'Each cap individually boxed');

    // Highlights
    P.highlights.forEach((text) => {
      fill('highlight-input', text);
      cy.get('[data-cy="add-highlight"]').click();
    });
    cy.get('[data-cy="highlight-item"]').should('have.length', 3);

    cy.screenshot('01-admin-form-filled', { capture: 'fullPage' });

    cy.intercept('POST', `${API}/products`).as('createProduct');
    cy.get('[data-cy="product-submit"]').click();
    cy.wait('@createProduct').then(({ response }) => {
      expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(201);
      product = response!.body.product;
    });
    cy.location('pathname').should('eq', '/dashboard/products');
  });

  it('ADMIN: the stored record holds every field entered in the form', () => {
    expect(product.slug).to.eq(P.slug);
    expect(product.basePrice).to.eq(299);
    expect(product.minOrderQty).to.eq(10);
    expect(product.stockCount).to.eq(500);
    expect(product.minSampleQty).to.eq(1);
    expect(product.ratingOverride).to.eq(4.8);
    expect(product.reviewCountOverride).to.eq(154);
    expect(product.orderMode).to.eq('BOTH');
    expect(product.category.slug).to.eq('caps');
    expect(product.isActive).to.eq(true);
    expect(product.requiresSize).to.eq(false);
    expect(product.customizationEnabled).to.eq(true);
    expect(product.designerEnabled).to.eq(true);
    expect(product.colors.map((c: any) => c.name)).to.deep.eq(P.colors);
    expect(product.bulkPricing.map((t: any) => [t.minQuantity, t.pricePerUnit])).to.deep.eq([
      [10, 299],
      [50, 279],
      [100, 259],
    ]);
    expect(product.images).to.have.length(3);
    product.images.forEach((url: string) => expect(url).to.match(/^https:\/\/res\.cloudinary\.com\//));
    expect(product.orderImages).to.have.length(1);
    expect(product.videos).to.have.length(2);
    expect(product.videos[0].url, 'reordered: second upload first').to.match(/\/video\/upload\//);
    expect(product.freeGift).to.include({ enabled: true, title: P.giftTitle });
    expect(product.offerAddon).to.include({ enabled: true, title: P.addonTitle, price: 15, priceType: 'PER_PIECE' });
    expect(product.highlights).to.deep.eq(P.highlights);
    expect(product.stockDeduction.pools).to.deep.eq([
      { stockType: 'Dark blank caps', colors: ['Matte Black', 'Navy Blue'], stock: 300 },
      { stockType: 'White blank caps', colors: ['Classic White'], stock: 200 },
    ]);
    expect(product.variants).to.have.length(3);
  });

  it('ADMIN: product list shows it, and the edit form still has all the entered data', () => {
    asAdmin();
    cy.visit('/dashboard/products');
    cy.get('input[placeholder="Search products..."]').type(P.slug);
    cy.contains('tr', P.name).should('be.visible').within(() => {
      cy.contains('Caps').should('exist');
      cy.contains('₹299').should('exist');
      cy.contains('3 colors').should('exist');
      cy.contains('Stock 500').should('exist');
    });
    cy.screenshot('02-admin-product-list');

    cy.get(`[data-cy="edit-product-${P.slug}"]`).click();
    cy.location('pathname').should('eq', `/dashboard/products/${product.id}/edit`);
    cy.get('[data-cy="product-name"]').should('have.value', P.name);
    cy.get('[data-cy="product-slug"]').should('have.value', P.slug);
    cy.get('[data-cy="product-description"]').should('have.value', P.description);
    cy.get('[data-cy="product-base-price"]').should('have.value', '299');
    cy.get('[data-cy="product-moq"]').should('have.value', '10');
    cy.get('[data-cy="product-stock"]').should('have.value', '500');
    cy.get('[data-cy="product-sample-qty"]').should('have.value', '1');
    cy.get('[data-cy="product-rating"]').should('have.value', '4.8');
    cy.get('[data-cy="product-review-count"]').should('have.value', '154');
    cy.get('[data-cy="pricing-range-row"]').should('have.length', 3);
    cy.get('[data-cy="range-pricePerUnit"]').last().should('have.value', '259');
    cy.get('[data-cy="range-maxQuantity"]').last().should('have.value', '');
    cy.get('[data-cy="order-mode-BOTH"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy="requires-size"]').should('not.be.checked');
    cy.get('[data-cy="color-chip"]').should('have.length', 3);
    cy.get('[data-cy="stock-enabled"]').should('be.checked');
    cy.get('[data-cy="stock-pool"]').should('have.length', 2);
    cy.get('[data-cy="stock-type"]').first().should('have.value', 'Dark blank caps');
    cy.get('[data-cy="stock-type-qty"]').first().should('have.value', '300');
    cy.get('[data-cy="product-image-item"]').should('have.length', 3);
    cy.get('[data-cy="order-image-item"]').should('have.length', 1);
    cy.get('[data-cy="video-item"]').should('have.length', 2);
    cy.get('[data-cy="gift-enabled"]').should('be.checked');
    cy.get('[data-cy="gift-title"]').should('have.value', P.giftTitle);
    cy.get('[data-cy="addon-enabled"]').should('be.checked');
    cy.get('[data-cy="addon-title"]').should('have.value', P.addonTitle);
    cy.get('[data-cy="addon-price"]').should('have.value', '15');
    cy.get('[data-cy="addon-price-type"]').should('have.value', 'PER_PIECE');
    cy.get('[data-cy="highlight-item"]').should('have.length', 3);
    cy.get('[data-cy="customization-enabled"]').should('be.checked');
    cy.get('[data-cy="designer-enabled"]').should('be.checked');
    cy.screenshot('03-admin-edit-form', { capture: 'fullPage' });
  });

  it('API: customers get the customer-facing fields and never the internal stock configuration', () => {
    cy.request(`${API}/products/${P.slug}`).then((res) => {
      const p = res.body.product;
      expect(p.id).to.eq(product.id);
      expect(p).to.not.have.property('stockDeduction');
      expect(p).to.not.have.property('stockCount');
      expect(JSON.stringify(res.body)).to.not.include('blank caps');
      expect(p.availableColors.map((c: any) => c.name)).to.deep.eq(P.colors);
      expect(p.availableSizes).to.deep.eq([]);
      expect(p.rating).to.eq(4.8);
      expect(p.reviewCount).to.eq(154);
      expect(p.moq).to.eq(10);
      expect(p.customizable).to.eq(true);
    });
    cy.request({ url: `${API}/products/${product.id}`, headers: { Authorization: `Bearer ${adminToken}` } }).then((res) => {
      expect(res.body.product.stockDeduction.enabled).to.eq(true);
    });
  });

  it('CUSTOMER: the product appears in the catalog with image, name, category, price, MOQ, rating and highlight', () => {
    asCustomer();
    cy.visit(`/customer/products?search=${P.slug}`);
    cy.get(`[data-cy="product-card-${product.id}"]`, { timeout: 20000 })
      .should('be.visible')
      .within(() => {
        cy.get('img').should('have.attr', 'src', product.images[0]);
        cy.get(`[data-cy="product-name-${product.id}"]`).should('have.text', P.name);
        cy.contains('Caps').should('exist');
        cy.get(`[data-cy="product-price-${product.id}"]`).should('contain', '₹259');
        cy.get(`[data-cy="product-moq-${product.id}"]`).should('contain', 'MOQ 10');
        cy.get(`[data-cy="product-rating-${product.id}"]`).should('contain', '4.8').and('contain', '154');
        cy.get(`[data-cy="product-highlight-${product.id}"]`).should('contain', P.highlights[0]);
        cy.get(`[data-cy="design-btn-${product.id}"]`).should('exist');
        cy.get(`[data-cy="details-btn-${product.id}"]`).should('not.exist');
      });
    cy.screenshot('04-customer-catalog');

    // Public catalog shows the same record
    asGuest();
    cy.visit('/products?category=caps');
    cy.get(`[data-cy="product-card-${P.slug}"]`, { timeout: 20000 }).within(() => {
      cy.get('[data-cy="product-card-image"]').should('have.attr', 'src', product.images[0]);
      cy.get('[data-cy="product-card-rating"]').should('contain', '4.8');
      cy.contains('₹259').should('exist');
      cy.contains('MOQ: 10 Pcs').should('exist');
    });
  });

  it('CUSTOMER: the retired product page redirects to the customizer', () => {
    asCustomer();
    cy.visit(`/products/${product.id}`);
    cy.location('pathname', { timeout: 20000 }).should('eq', `/products/${product.id}/customize`);
    cy.contains('h1', P.name, { timeout: 20000 }).should('be.visible');
    cy.contains('blank caps').should('not.exist');
    cy.contains('Stock deduction', { matchCase: false }).should('not.exist');
  });

  it('CUSTOMIZER: cap template, only the product colours, server pricing, gift and addon → quote', () => {
    asCustomer();
    cy.viewport(1280, 800);
    cy.visit('/customer/products?search=' + P.slug);
    cy.get(`[data-cy="design-btn-${product.id}"]`, { timeout: 20000 }).click();
    cy.location('pathname').should('eq', `/products/${product.id}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 30000 }).should('exist');
    cy.contains('h1', P.name).should('be.visible');

    // Product-specific template and colours
    cy.get('#tab-tool-colors').click();
    cy.contains('CROWN COLOR').should('be.visible');
    cy.contains('BODY COLOR').should('not.exist');
    cy.get('[data-cy="customizer-body-colors"] button').should('have.length', 3);
    cy.get('[data-cy="customizer-body-colors"] button').then(($buttons) => {
      expect([...$buttons].map((b) => b.getAttribute('title'))).to.deep.eq(P.colors);
    });
    ['Lime', 'Hot Pink', 'Purple', 'Yellow', 'Orange'].forEach((unrelated) =>
      cy.get(`button[title="${unrelated}"]`).should('not.exist')
    );
    cy.get('button[title="Navy Blue"]').first().click();
    cy.get('button[title="Navy Blue"]').first().should('have.attr', 'aria-pressed', 'true');

    // Canvas tools still work: place text on the cap
    cy.window().then((win: any) =>
      win.__getCanvasRef().addText('DEV', { fontFamily: 'Inter', fontSize: 24, fill: '#FFFFFF' })
    );
    cy.screenshot('06-customizer-studio');

    // Checkout step
    cy.intercept('POST', `${API}/quotes/pricing-preview`).as('pricing');
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.get('#customizer-review-sheet').should('be.visible');
    cy.get('[data-cy="review-color"]').should('have.text', 'Navy Blue');
    cy.get('[data-cy="review-size-grid"]').should('not.exist'); // requiresSize = false
    cy.get('[data-cy="review-size-options"]').should('not.exist');

    cy.get('[data-cy="review-quantity"]').should('have.value', '10');
    cy.get('[data-cy="review-unit-price"]').should('contain', '₹299');
    cy.get('[data-cy="review-quantity"]').clear().type('50');
    cy.get('[data-cy="review-unit-price"]').should('contain', '₹279');
    cy.get('[data-cy="review-subtotal"]').should('contain', '₹13,950');
    cy.get('[data-cy="review-free-gift"]').should('contain', P.giftTitle);

    // Opt into the addon: server adds 50 × ₹15
    cy.get('[data-cy="review-addon"]').should('contain', P.addonTitle).and('contain', '+₹15 / pc');
    cy.get('[data-cy="review-addon-checkbox"]').check();
    cy.get('[data-cy="review-addon-amount"]').should('contain', '₹750');
    cy.get('[data-cy="review-subtotal"]').should('contain', '₹14,700');
    cy.get('[data-cy="review-total"]').should('contain', '₹15,435'); // + 5% GST
    cy.screenshot('07-customizer-checkout');

    cy.intercept('POST', `${API}/quotes`).as('createQuote');
    cy.get('#customizer-confirm-btn').should('not.be.disabled').click();
    cy.wait('@createQuote', { timeout: 90000 }).then(({ request, response }) => {
      expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(201);
      expect(request.body).to.not.have.property('unitPrice'); // the browser sends no prices
      const quote = response!.body.quote;
      expect(quote.items[0].productId).to.eq(product.id);
      expect(quote.items[0].color).to.eq('Navy Blue');
      expect(quote.items[0].quantity).to.eq(50);
      expect(quote.items[0].unitPrice).to.eq(279);
      expect(quote.addonTitle).to.eq(P.addonTitle);
      expect(quote.addonAmount).to.eq(750);
      expect(quote.freeGiftTitle).to.eq(P.giftTitle);
      expect(quote.subtotal).to.eq(14700);
      expect(quote.totalAmount).to.eq(15435);
    });
    cy.location('pathname', { timeout: 20000 }).should('eq', '/customer/quotes');
  });

  it('CUSTOMIZATION OFF: the customer is not offered the canvas designer', () => {
    asAdmin();
    cy.visit(`/dashboard/products/${product.id}/edit`);
    cy.get('[data-cy="product-name"]').should('have.value', P.name);
    cy.get('[data-cy="customization-enabled"]').uncheck();
    cy.intercept('PUT', `${API}/products/${product.id}`).as('save');
    cy.get('[data-cy="product-submit"]').click();
    cy.wait('@save').its('response.statusCode').should('eq', 200);

    asCustomer();
    cy.visit('/customer/products?search=' + P.slug);
    cy.get(`[data-cy="product-card-${product.id}"]`, { timeout: 20000 }).should('be.visible');
    cy.get(`[data-cy="design-btn-${product.id}"]`).should('not.exist');
    // The old product link lands on the "not available" screen, which offers a quote instead
    cy.visit(`/products/${product.id}`);
    cy.get('[data-cy="customizer-unavailable"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="customizer-unavailable-quote"]').should('have.attr', 'href').and('include', '/get-quote');
    cy.get('#customizer-canvas-wrapper').should('not.exist');
    cy.screenshot('08-customizer-unavailable');

    // Turn it back on
    asAdmin();
    cy.visit(`/dashboard/products/${product.id}/edit`);
    cy.get('[data-cy="product-name"]').should('have.value', P.name);
    cy.get('[data-cy="customization-enabled"]').check();
    cy.intercept('PUT', `${API}/products/${product.id}`).as('saveOn');
    cy.get('[data-cy="product-submit"]').click();
    cy.wait('@saveOn').its('response.statusCode').should('eq', 200);
  });

  it('INACTIVE: hidden from customers and rejected for new quotes; admin can still edit and re-activate', () => {
    asAdmin();
    cy.visit(`/dashboard/products/${product.id}/edit`);
    cy.get('[data-cy="product-name"]').should('have.value', P.name);
    cy.contains('button', 'Draft').click();
    cy.intercept('PUT', `${API}/products/${product.id}`).as('deactivate');
    cy.get('[data-cy="product-submit"]').click();
    cy.wait('@deactivate').its('response.statusCode').should('eq', 200);

    asCustomer();
    cy.visit('/customer/products?search=' + P.slug);
    cy.get('[data-cy="empty-state"]', { timeout: 20000 }).should('be.visible');
    cy.contains(P.name).should('not.exist');
    cy.visit(`/products/${product.id}`);
    cy.contains('Product Not Found', { timeout: 20000 }).should('be.visible');

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: `${API}/quotes`,
        headers: { Authorization: `Bearer ${customerSession!.token}` },
        body: { productId: product.id, quantity: 50 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.message).to.match(/not available/);
      });
    });

    // Admin still sees it (Draft filter) and re-activates it from the edit form
    asAdmin();
    cy.visit('/dashboard/products');
    cy.get('select').filter(':has(option:contains("All Status"))').first().select('Draft');
    cy.get('input[placeholder="Search products..."]').type(P.slug);
    cy.contains('tr', P.name).should('be.visible');
    cy.get(`[data-cy="edit-product-${P.slug}"]`).click();
    cy.get('[data-cy="product-name"]').should('have.value', P.name);
    cy.contains('button', 'Active').click();
    cy.intercept('PUT', `${API}/products/${product.id}`).as('activate');
    cy.get('[data-cy="product-submit"]').click();
    cy.wait('@activate').its('response.statusCode').should('eq', 200);

    // Visible to customers again, with nothing lost by the edits
    cy.request(`${API}/products/${P.slug}`).then((res) => {
      const p = res.body.product;
      expect(p.isActive).to.eq(true);
      expect(p.customizable).to.eq(true);
      expect(p.availableColors.map((c: any) => c.name)).to.deep.eq(P.colors);
      expect(p.bulkPricing).to.have.length(3);
      expect(p.highlights).to.deep.eq(P.highlights);
      expect(p.videos).to.have.length(2);
      expect(p.orderImages).to.have.length(1);
      expect(p.images).to.have.length(3);
      expect(p.freeGift.title).to.eq(P.giftTitle);
      expect(p.offerAddon.title).to.eq(P.addonTitle);
    });
  });
});
