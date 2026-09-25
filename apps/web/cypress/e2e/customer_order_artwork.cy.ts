/// <reference types="cypress" />

describe('Customer Order Artwork View & Download End-to-End', () => {
  const customerEmail = 'ajay@gmail.com';
  const customerPassword = '123456';
  let customerToken = '';
  let customerUser: any = null;
  let customerOrderId = '';
  let otherCustomerOrderId = '';

  before(() => {
    // 1. Authenticate customer
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

      // 2. Fetch customer orders to find an order with artwork (e.g. ZQB-ORD-2026-5020)
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/v1/orders',
        headers: { Authorization: `Bearer ${customerToken}` },
      }).then((orderRes) => {
        const orders = orderRes.body.orders || orderRes.body.data || [];
        const orderWithArtwork = orders.find(
          (o: any) => o.artworkUrl || o.previewFrontUrl || o.previewBackUrl
        );
        expect(orderWithArtwork, 'Customer should have an order with artwork assets').to.exist;
        customerOrderId = orderWithArtwork.id;
      });
    });

    // 3. Login as Admin to get an order belonging to another customer
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/login',
      body: {
        email: 'admin@zobra.test',
        password: 'admin123',
      },
    }).then((adminLogin) => {
      const adminToken = adminLogin.body.token;
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/api/v1/orders',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((adminOrdersRes) => {
        const allOrders = adminOrdersRes.body.orders || adminOrdersRes.body.data || [];
        const otherOrder = allOrders.find(
          (o: any) => o.customerId !== customerUser.id && (o.artworkUrl || o.previewFrontUrl)
        );
        if (otherOrder) {
          otherCustomerOrderId = otherOrder.id;
        }
      });
    });
  });

  // Helper to establish customer session
  const setCustomerSession = () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', customerToken);
      win.localStorage.setItem('zobra_token', customerToken);
      win.localStorage.setItem('user', JSON.stringify(customerUser));
      win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
    });
  };

  it('1. Login customer', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').clear().type(customerEmail);
    cy.get('[data-cy="password-input"]').clear().type(customerPassword);
    cy.get('[data-cy="login-submit-button"]').click();
    cy.url().should('include', '/customer');
  });

  it('2. Open My Orders', () => {
    cy.visit('/customer/orders', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('h1').should('contain', 'My Orders');
    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('3. Open View Order', () => {
    cy.visit('/customer/orders', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    // Click VIEW ORDER on the order with artwork
    cy.contains('VIEW ORDER').first().click();
    cy.url().should('include', '/customer/orders/');
    cy.get('h1').should('be.visible');
  });

  it('4. Artwork section visible when assets exist', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="order-design-assets-section"]').should('be.visible');
    cy.contains('DESIGN & ARTWORK').should('be.visible');
    cy.get('[data-cy="asset-card-artwork"]').should('be.visible');
  });

  it('5. View original artwork', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="view-asset-artwork"]').click();
    cy.get('[data-cy="asset-preview-modal"]').should('be.visible');
    cy.get('[data-cy="modal-asset-img"]').should('be.visible');
    cy.get('[data-cy="modal-download-btn"]').should('be.visible');

    // Close modal
    cy.get('[data-cy="close-asset-modal"]').click();
    cy.get('[data-cy="asset-preview-modal"]').should('not.exist');
  });

  it('6. Download original artwork', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="download-asset-artwork"]').should('be.visible').click();
    // After download click, button shows feedback (Done / Downloaded)
    cy.get('[data-cy="download-asset-artwork"]').should('exist');
  });

  it('7. View front preview', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="view-asset-front"]').should('be.visible').click();
    cy.get('[data-cy="asset-preview-modal"]').should('be.visible');
    cy.get('[data-cy="modal-asset-img"]').should('be.visible');
    cy.get('[data-cy="close-asset-modal"]').click();
    cy.get('[data-cy="asset-preview-modal"]').should('not.exist');
  });

  it('8. Download front preview', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="download-asset-front"]').should('be.visible').click();
    cy.get('[data-cy="download-asset-front"]').should('exist');
  });

  it('9. View back preview', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="view-asset-back"]').should('be.visible').click();
    cy.get('[data-cy="asset-preview-modal"]').should('be.visible');
    cy.get('[data-cy="modal-asset-img"]').should('be.visible');
    cy.get('[data-cy="close-asset-modal"]').click();
    cy.get('[data-cy="asset-preview-modal"]').should('not.exist');
  });

  it('10. Download back preview', () => {
    cy.visit(`/customer/orders/${customerOrderId}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.get('[data-cy="download-asset-back"]').should('be.visible').click();
    cy.get('[data-cy="download-asset-back"]').should('exist');
  });

  it('11. Verify another customer\'s order cannot be accessed', () => {
    if (!otherCustomerOrderId) {
      cy.log('No other customer order found, skipping direct ID check');
      return;
    }

    // Direct API verification: Customer token attempting to fetch other customer order returns 403
    cy.request({
      method: 'GET',
      url: `http://localhost:5000/api/v1/orders/${otherCustomerOrderId}`,
      headers: { Authorization: `Bearer ${customerToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403);
      expect(res.body.success).to.eq(false);
      expect(res.body.order).to.be.undefined;
    });

    // Frontend page visit verification: Customer viewing other customer order sees "Order Not Found"
    cy.visit(`/customer/orders/${otherCustomerOrderId}`, {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
        win.localStorage.setItem('user', JSON.stringify(customerUser));
        win.localStorage.setItem('zobra_user', JSON.stringify(customerUser));
      },
    });

    cy.contains('Order Not Found').should('be.visible');
    cy.get('[data-cy="order-design-assets-section"]').should('not.exist');
  });
});
