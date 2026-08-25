/// <reference types="cypress" />

describe('Manual Payment Flow', () => {
  const e2eUser = {
    email: `manual-pay-${Date.now()}@zobbra.test`,
    password: 'Password@123'
  };
  
  let orderId: string;

  before(() => {
    // Generate a dummy customer, quote, and order via API for testing
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/v1/auth/register',
      body: {
        name: 'Manual Pay User',
        email: e2eUser.email,
        password: e2eUser.password,
        phone: '1234567890',
        companyName: 'Test LLC'
      }
    }).then((res) => {
      const token = res.body.token;
      
      // Seed Quote
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/quotes',
        headers: { Authorization: `Bearer ${token}` },
        body: { items: [], subtotal: 1000, gstTotal: 180, totalAmount: 1180, notes: "Test" }
      }).then((quoteRes) => {
         const quoteId = quoteRes.body.quote.id;
         
         // Admin approves quote and creates order
         cy.request({
           method: 'POST',
           url: 'http://localhost:5000/api/v1/auth/login',
           body: { email: 'admin@zobra.test', password: 'admin123' }
         }).then((adminLogin) => {
            const adminToken = adminLogin.body.token;
            
            // Mark quote as approved first
            cy.request({
              method: 'PUT',
              url: `http://localhost:5000/api/v1/quotes/${quoteId}/status`,
              headers: { Authorization: `Bearer ${adminToken}` },
              body: { status: 'APPROVED' }
            }).then(() => {
                cy.request({
                  method: 'POST',
                  url: `http://localhost:5000/api/v1/orders/from-quote/${quoteId}`,
                  headers: { Authorization: `Bearer ${adminToken}` }
                }).then((orderRes) => {
                   orderId = orderRes.body.order.id;
                });
            });
         });
      });
    });
  });

  it('Customer sees UNPAID order and Disabled Online Payment', () => {
    cy.login(e2eUser.email, e2eUser.password);
    cy.visit(`/customer/orders/${orderId}`);
    
    // Check UI elements
    cy.contains('UNPAID').should('exist');
    cy.contains('ONLINE PAYMENT — COMING SOON').should('be.visible').and('be.disabled');
    cy.contains('CONTACT SALES ON WHATSAPP').should('be.visible');
    cy.contains('Payment will be arranged with our sales team').should('be.visible');
  });

  it('Admin records Manual Payment', () => {
    cy.clearLocalStorage();
    cy.login('admin@zobra.test', 'admin123');
    
    // Call the API endpoint as admin
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/v1/payments/record',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          orderId: orderId,
          amount: 1180,
          method: 'BANK_TRANSFER',
          reference: 'UTR123'
        }
      }).then((res) => {
        expect(res.status).to.eq(200);
      });
    });
  });

  it('Customer sees PAID order', () => {
    cy.clearLocalStorage();
    cy.login(e2eUser.email, e2eUser.password);
    cy.visit(`/customer/orders/${orderId}`);
    
    cy.contains('PAYMENT COMPLETED & VERIFIED').should('be.visible');
  });

});
