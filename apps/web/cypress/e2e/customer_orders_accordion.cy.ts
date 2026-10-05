/// <reference types="cypress" />

/**
 * Customer Orders accordion: clicking an order expands its details inline on /customer/orders
 * (no navigation to /customer/orders/[id]). The order list/detail responses are stubbed so the
 * UI behaviour is deterministic; the ownership check at the end hits the real API.
 */
const API = 'http://localhost:5000/api/v1';
const CUSTOMER_EMAIL = 'dev-product-flow-customer@zobra.test';

const IMG = (name: string) => `https://res.cloudinary.com/demo/image/upload/v1/zobbra/${name}.png`;

const orderA = {
  id: 'order-a-id',
  orderNumber: 'ZQB-ORD-TEST-A',
  createdAt: '2026-10-01T06:00:00.000Z',
  status: 'CONFIRMED',
  paymentStatus: 'PARTIAL',
  subtotal: 5980,
  gstTotal: 299,
  discountAmount: 0,
  totalAmount: 6279,
  artworkUrl: IMG('logo'),
  previewFrontUrl: IMG('front'),
  previewBackUrl: IMG('back'),
  freeGiftTitle: 'Free sticker pack',
  customer: { id: 'c1', name: 'Asha Rao', email: null, phone: '+919876500001' },
  company: { name: 'Asha Traders', gstin: null, address: 'Plot 4, Saheed Nagar', city: 'Bhubaneswar', state: 'Odisha', pincode: '751007' },
  quote: { quoteNumber: 'ZQB-QT-TEST-1' },
  items: [
    {
      id: 'item-a1',
      productId: 'p1',
      product: { name: 'Classic Corporate Pique Polo T-Shirt', images: [IMG('polo')], gstRate: 5 },
      printType: 'Front Only',
      color: 'Navy Blue',
      size: 'S',
      quantity: 20,
      unitPrice: 299,
      totalPrice: 5980,
      customizationDetails: 'Print: Custom Online Design - Front Only | Customization: {"selectedColor":"Navy Blue"} | Notes: Pack by size',
      variants: [
        { id: 'v1', color: 'Navy Blue', size: 'S', quantity: 8 },
        { id: 'v2', color: 'Navy Blue', size: 'L', quantity: 12 },
      ],
    },
  ],
  payments: [{ id: 'pay1', razorpayPaymentId: 'pay_TEST123', amount: 2000, status: 'SUCCESS', createdAt: '2026-10-01T07:00:00.000Z' }],
  dispatch: null,
};

const orderB = {
  ...orderA,
  id: 'order-b-id',
  orderNumber: 'ZQB-ORD-TEST-B',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  artworkUrl: null,
  previewFrontUrl: null,
  previewBackUrl: null,
  freeGiftTitle: null,
  payments: [],
  items: [{ ...orderA.items[0], id: 'item-b1', product: { name: 'Classic Cotton Cap', images: [], gstRate: 5 }, variants: [] }],
};

const row = (o: { orderNumber: string }) => `[data-cy="order-row-${o.orderNumber}"]`;

describe('Customer Orders — inline accordion', () => {
  let session: { token: string; user: any };
  let detailCalls: Record<string, number>;

  before(() => {
    cy.task('e2eSessionForEmail', { email: CUSTOMER_EMAIL }).then((existing: any) => {
      if (existing) {
        session = existing;
        return;
      }
      cy.task('e2eCreateCustomer', { name: 'Dev Product Flow Customer', email: CUSTOMER_EMAIL }).then((created: any) => {
        session = { token: created.body.token, user: created.body.user };
      });
    });
  });

  const visitOrders = () => {
    detailCalls = {};
    cy.intercept('GET', `${API}/orders`, { success: true, data: [orderA, orderB], orders: [orderA, orderB] }).as('orders');
    cy.intercept('GET', `${API}/orders/order-a-id`, (req) => {
      detailCalls.a = (detailCalls.a || 0) + 1;
      req.reply({ delay: 400, body: { success: true, order: orderA } });
    }).as('detailA');
    cy.intercept('GET', `${API}/orders/order-b-id`, (req) => {
      detailCalls.b = (detailCalls.b || 0) + 1;
      req.reply({ success: true, order: orderB });
    }).as('detailB');
    cy.visit('/customer/orders', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', session.token);
        win.localStorage.setItem('zobra_token', session.token);
        win.localStorage.setItem('user', JSON.stringify(session.user));
        win.localStorage.setItem('zobra_user', JSON.stringify(session.user));
      },
    });
    cy.wait('@orders');
  };

  const stayedOnList = () => cy.location('pathname').should('eq', '/customer/orders');

  it('loads with every order collapsed and a down arrow on each row', () => {
    visitOrders();
    cy.contains('h1', 'My Orders').should('be.visible');
    cy.get(row(orderA)).should('contain', orderA.orderNumber).and('contain', 'Classic Corporate Pique Polo T-Shirt').and('contain', '20 pcs').and('contain', '₹6,279');
    cy.get(row(orderB)).should('contain', orderB.orderNumber);
    // The product's own image sits before the product name; a neutral icon when it has none
    cy.get(row(orderA)).find('[data-cy="order-product-image"]').should('have.attr', 'src', IMG('polo'));
    cy.get(row(orderB)).find('[data-cy="order-product-image"]').should('not.exist');
    cy.get('[data-cy="order-arrow-down"]').should('have.length', 2);
    cy.get('[data-cy="order-arrow-up"]').should('not.exist');
    cy.get('[data-cy="order-panel"]').should('not.exist');
    cy.get('[data-cy="order-row-toggle"]').each(($el) => expect($el.attr('aria-expanded')).to.eq('false'));
    // The rows are not links to the detail page
    cy.get('a[href^="/customer/orders/"]').should('not.exist');
    cy.then(() => expect(detailCalls).to.deep.eq({})); // no detail is fetched up front
  });

  it('expands inline below the row with a loading state, shows the up arrow, and keeps the URL', () => {
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-panel-loading"]').should('be.visible');
    cy.wait('@detailA');
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderA)).find('[data-cy="order-arrow-up"]').should('exist');
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').should('have.attr', 'aria-expanded', 'true');
    cy.get(row(orderB)).find('[data-cy="order-arrow-down"]').should('exist');
    cy.get(row(orderB)).find('[data-cy="order-panel"]').should('not.exist');
    stayedOnList();
    cy.location('search').should('eq', '');
  });

  it('shows the customer-facing order details', () => {
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').within(() => {
      cy.get('[data-cy="order-details-summary"]')
        .should('contain', orderA.orderNumber)
        .and('contain', '1/10/2026')
        .and('contain', 'ZQB-QT-TEST-1')
        .and('contain', 'GST (5%)');
      cy.get('[data-cy="order-total-amount"]').should('contain', '₹6,279');
      cy.get('[data-cy="order-paid-amount"]').should('contain', '₹2,000');
      cy.get('[data-cy="order-due-amount"]').should('contain', '₹4,279');

      cy.get('[data-cy="order-details-delivery"]')
        .should('contain', 'Asha Rao')
        .and('contain', '+919876500001')
        .and('contain', 'Plot 4, Saheed Nagar')
        .and('contain', 'Bhubaneswar, Odisha, 751007');

      cy.get('[data-cy="order-item-name"]').should('have.text', 'Classic Corporate Pique Polo T-Shirt');
      cy.get('[data-cy="order-item-image"]').should('have.attr', 'src', IMG('polo'));
      cy.get('[data-cy="order-item-qty"]').should('contain', '20 Pcs').and('contain', '₹299');
      cy.get('[data-cy="order-item-total"]').should('contain', '₹5,980');
      cy.get('[data-cy="order-item-variants"]').should('contain', 'Navy Blue / S').and('contain', '× 8').and('contain', 'Navy Blue / L').and('contain', '× 12');

      cy.get('[data-cy="order-details-specs"]').should('contain', 'Free sticker pack').and('contain', 'Pack by size').and('not.contain', 'selectedColor');
      cy.get('[data-cy="order-details-payments"]').should('contain', 'pay_TEST123');
      cy.get('[data-cy="contact-sales-btn"]').should('have.attr', 'href').and('include', 'wa.me');
    });
  });

  it('artwork assets work inside the expanded section (view and download)', () => {
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').within(() => {
      cy.contains('Design & Artwork', { matchCase: false }).should('exist');
      cy.get(`img[src*="front"]`).should('exist');
      cy.get(`img[src*="back"]`).should('exist');
      cy.get(`img[src*="logo"]`).should('exist');
    });
    // Opening an asset shows the preview, and using it neither collapses the order nor navigates
    cy.get(row(orderA)).find('[data-cy="order-details"]').find('button').filter(':contains("View")').first().click();
    cy.contains('button', /download/i).should('exist');
    cy.get('body').type('{esc}');
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    stayedOnList();
  });

  it('clicking the same order again collapses it; reopening uses the cached details', () => {
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderA)).find('[data-cy="order-arrow-up"]').click();
    cy.get(row(orderA)).find('[data-cy="order-panel"]').should('not.exist');
    cy.get(row(orderA)).find('[data-cy="order-arrow-down"]').should('exist');

    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderA)).find('[data-cy="order-panel-loading"]').should('not.exist');
    cy.then(() => expect(detailCalls.a, 'detail fetched once').to.eq(1));
    stayedOnList();
  });

  it('opening another order closes the previous one', () => {
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderB)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderB)).find('[data-cy="order-details"]').should('be.visible').and('contain', 'Classic Cotton Cap');
    cy.get(row(orderA)).find('[data-cy="order-panel"]').should('not.exist');
    cy.get('[data-cy="order-panel"]').should('have.length', 1);
    cy.get('[data-cy="order-arrow-up"]').should('have.length', 1);
    stayedOnList();
  });

  it('keyboard: Enter toggles the focused order', () => {
    visitOrders();
    cy.get(row(orderB)).find('[data-cy="order-row-toggle"]').focus().type('{enter}');
    cy.get(row(orderB)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderB)).find('[data-cy="order-row-toggle"]').focus().type('{enter}');
    cy.get(row(orderB)).find('[data-cy="order-panel"]').should('not.exist');
  });

  it('a failed detail load shows an inline error with retry, without redirecting or leaking server details', () => {
    visitOrders();
    let fail = true;
    cy.intercept('GET', `${API}/orders/order-b-id`, (req) => {
      if (fail) req.reply({ statusCode: 500, body: { success: false, message: 'PrismaClientKnownRequestError: connection refused' } });
      else req.reply({ success: true, order: orderB });
    });
    cy.get(row(orderB)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderB)).find('[data-cy="order-panel-error"]').should('be.visible').and('contain', "couldn't load").and('not.contain', 'Prisma');
    stayedOnList();
    cy.then(() => {
      fail = false;
    });
    cy.get(row(orderB)).contains('button', 'TRY AGAIN').click();
    cy.get(row(orderB)).find('[data-cy="order-details"]').should('be.visible');
    stayedOnList();
  });

  it('mobile: tapping the row expands below it with no horizontal scrolling', () => {
    cy.viewport(390, 844);
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.get(row(orderA)).find('[data-cy="order-item-variants"]').should('be.visible');
    stayedOnList();
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth, 'no horizontal overflow').to.be.lte(doc.documentElement.clientWidth);
    });
    cy.get('[data-cy="orders-list"]').then(($list) => {
      expect($list[0].scrollWidth, 'list fits its container').to.be.lte($list[0].clientWidth + 1);
    });
    cy.screenshot('orders-accordion-mobile', { capture: 'fullPage' });
  });

  it('desktop screenshot', () => {
    cy.viewport(1440, 900);
    visitOrders();
    cy.get(row(orderA)).find('[data-cy="order-row-toggle"]').click();
    cy.get(row(orderA)).find('[data-cy="order-details"]').should('be.visible');
    cy.screenshot('orders-accordion-desktop', { capture: 'fullPage' });
  });

  it('API: a customer cannot load another customer\'s order (real endpoint)', () => {
    cy.request('POST', `${API}/auth/login`, { email: 'admin@zobra.test', password: 'admin123' }).then((admin) => {
      cy.request({ url: `${API}/orders?pageSize=50`, headers: { Authorization: `Bearer ${admin.body.token}` } }).then((res) => {
        const other = (res.body.data || []).find((o: any) => o.customerId !== session.user.id);
        if (!other) {
          cy.log('No other customer order in the dev database; ownership is covered by server/tests/orders.test.ts');
          return;
        }
        cy.request({
          url: `${API}/orders/${other.id}`,
          headers: { Authorization: `Bearer ${session.token}` },
          failOnStatusCode: false,
        }).then((denied) => {
          expect(denied.status).to.eq(403);
          expect(denied.body).to.not.have.property('order');
        });
      });
    });
    cy.request({ url: `${API}/orders/does-not-exist`, failOnStatusCode: false }).its('status').should('eq', 401);
  });
});
