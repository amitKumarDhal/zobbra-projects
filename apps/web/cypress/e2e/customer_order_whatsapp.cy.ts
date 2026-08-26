/// <reference types="cypress" />

describe('Customer Order WhatsApp Contact Sales Verification', () => {
  let token: string;
  let orderId: string;
  let orderNumber: string;
  let customerName = 'Rahul Sharma';
  let rawPhone = '+91 98765 43210';
  let expectedNormalizedPhone = '919876543210';

  before(() => {
    cy.login('customer@zobra.test', 'customer123');
    cy.window().then(async (win) => {
      token = win.localStorage.getItem('token') || '';

      // Update user phone number if needed to guarantee known format
      await fetch('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(async (userRes) => {
        if (userRes.user?.id) {
          customerName = userRes.user.name || customerName;
        }
      });

      // Get or create an approved quote and convert to order
      const quoteRes = await fetch('http://localhost:5000/api/v1/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: customerName,
          phone: rawPhone,
          quantity: 100,
          status: 'APPROVED',
          notes: 'WhatsApp Verification Quote'
        })
      }).then(r => r.json());

      const quoteId = quoteRes.quote?.id;

      // Convert to order
      const orderRes = await fetch(`http://localhost:5000/api/v1/orders/from-quote/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }).then(r => r.json());

      orderId = orderRes.order?.id;
      orderNumber = orderRes.order?.orderNumber;
    });
  });

  it('verifies that CONTACT SALES ON WHATSAPP has a valid, normalized wa.me URL with pre-filled message', () => {
    cy.login('customer@zobra.test', 'customer123');
    cy.visit(`/customer/orders/${orderId}`);

    // Verify order page loads
    cy.url().should('include', `/customer/orders/${orderId}`);
    cy.contains(orderNumber).should('be.visible');

    // Locate the WhatsApp Contact Sales button in Price Summary Card
    cy.get('[data-cy="contact-sales-btn"]')
      .should('be.visible')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('have.attr', 'href')
      .then((href: any) => {
        expect(href).to.be.a('string');
        expect(href).to.match(/^https:\/\/wa\.me\/\d+/);

        const url = new URL(href);
        // Verify normalized phone in pathname
        expect(url.pathname).to.include(expectedNormalizedPhone);

        // Verify pre-filled message query parameter
        const messageText = decodeURIComponent(url.searchParams.get('text') || '');
        expect(messageText).to.include('ZOBBRA');
        expect(messageText).to.include(orderNumber);
        expect(messageText).to.include('payment');
        expect(messageText).to.include('Order Amount');
      });

    // Also verify Header button has matching URL
    cy.get('[data-cy="contact-sales-header-btn"]')
      .should('be.visible')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .then((href: any) => {
        expect(href).to.match(/^https:\/\/wa\.me\/\d+/);
      });
  });
});
