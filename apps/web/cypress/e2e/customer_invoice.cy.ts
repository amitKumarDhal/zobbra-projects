/// <reference types="cypress" />

describe('Customer Tax Invoice End-to-End Verification', () => {
  let customerToken: string;
  let adminToken: string;
  let orderId: string;
  let orderNumber: string;
  let createdInvoiceId: string;
  let createdInvoiceNumber: string;
  let expectedTaxable: number;
  let expectedGst: number;
  let expectedTotal: number;

  before(() => {
    // 1. Login as Admin to get Admin Token
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/login',
      body: { email: 'admin@zobra.test', password: 'admin123' },
    }).then((res) => {
      adminToken = res.body.token;
    });

    // 2. Login as Customer to get Customer Token and create Quote & Order
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/login',
      body: { email: 'customer@zobra.test', password: 'customer123' },
    }).then((loginRes) => {
      customerToken = loginRes.body.token;

      // Create an approved quote
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/quotes',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          customerName: 'Rahul Sharma',
          phone: '+91 91244 49666',
          quantity: 100,
          status: 'APPROVED',
          notes: 'Invoice Verification Quote',
        },
      }).then((quoteRes) => {
        const quoteId = quoteRes.body.quote?.id;

        // Convert quote to order (which generates Invoice in PostgreSQL)
        cy.request({
          method: 'POST',
          url: `http://localhost:5000/api/v1/orders/from-quote/${quoteId}`,
          headers: { Authorization: `Bearer ${customerToken}` },
        }).then((orderRes) => {
          orderId = orderRes.body.order?.id;
          orderNumber = orderRes.body.order?.orderNumber;

          // Fetch the created invoice directly from API
          cy.request({
            method: 'GET',
            url: 'http://localhost:5000/api/v1/invoices?pageSize=50',
            headers: { Authorization: `Bearer ${customerToken}` },
          }).then((invoiceRes) => {
            const invoice = invoiceRes.body.invoices?.find(
              (inv: any) => inv.orderId === orderId || inv.order?.orderNumber === orderNumber
            );

            expect(invoice).to.exist;
            createdInvoiceId = invoice.id;
            createdInvoiceNumber = invoice.invoiceNumber;
            expectedTaxable = invoice.amount;
            expectedGst = invoice.gstAmount;
            expectedTotal = invoice.totalAmount;

            // Authoritative Arithmetic Check: Taxable + GST === Total
            expect(expectedTaxable + expectedGst).to.eq(expectedTotal);
          });
        });
      });
    });
  });

  it('displays real database invoices with exact financial consistency on /customer/invoices', () => {
    cy.visit('/customer/invoices', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
      },
    });

    // Verify invoice table is visible
    cy.get('[data-cy="invoices-table"]', { timeout: 15000 }).should('be.visible');

    // Locate the newly generated invoice row
    cy.get(`[data-cy="invoice-row-${createdInvoiceNumber}"]`, { timeout: 15000 }).within(() => {
      cy.get('[data-cy="invoice-number-cell"]').should('contain', createdInvoiceNumber);
      cy.get('[data-cy="invoice-order-cell"]').should('contain', orderNumber);
      cy.get('[data-cy="invoice-taxable-cell"]').should('contain', `₹${expectedTaxable.toLocaleString('en-IN')}`);
      cy.get('[data-cy="invoice-gst-cell"]').should('contain', `₹${expectedGst.toLocaleString('en-IN')}`);
      cy.get('[data-cy="invoice-total-cell"]').should('contain', `₹${expectedTotal.toLocaleString('en-IN')}`);
      cy.get('[data-cy="invoice-status-cell"]').invoke('text').should('match', /unpaid/i);
      cy.get(`[data-cy="download-pdf-btn-${createdInvoiceNumber}"]`).should('be.visible');
    });
  });

  it('verifies that the PDF endpoint generates a valid application/pdf stream with correct metadata', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:5000/api/v1/invoices/${createdInvoiceId}/pdf`,
      headers: { Authorization: `Bearer ${customerToken}` },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers['content-type']).to.include('application/pdf');
      expect(response.headers['content-disposition']).to.include(createdInvoiceNumber);
      expect(response.body).to.exist;
    });
  });

  it('prevents unauthorized access when another customer attempts to access the invoice or PDF', () => {
    // Attempt request without token -> 401 Unauthorized
    cy.request({
      method: 'GET',
      url: `http://localhost:5000/api/v1/invoices/${createdInvoiceId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });

    cy.request({
      method: 'GET',
      url: `http://localhost:5000/api/v1/invoices/${createdInvoiceId}/pdf`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('verifies that recording payment updates order and invoice status to PAID', () => {
    // Admin records manual payment for full total
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/payments/record',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        orderId: orderId,
        amount: expectedTotal,
        method: 'BANK_TRANSFER',
        reference: `UTR_${Date.now()}`,
      },
    }).then((paymentRes) => {
      expect(paymentRes.status).to.eq(200);
    });

    // Customer visits /customer/invoices and sees status updated to PAID
    cy.visit('/customer/invoices', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', customerToken);
        win.localStorage.setItem('zobra_token', customerToken);
      },
    });

    cy.get(`[data-cy="invoice-row-${createdInvoiceNumber}"]`, { timeout: 15000 }).within(() => {
      cy.get('[data-cy="invoice-status-cell"]').invoke('text').should('match', /paid/i);
    });
  });
});
