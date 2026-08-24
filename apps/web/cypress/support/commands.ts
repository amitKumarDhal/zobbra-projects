/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'admin@zobra.test', password = 'admin123') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/v1/auth/login',
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.eq(true);
    
    // Visit a page on the same origin so localStorage can be set
    cy.visit('/');
    
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('zobra_token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
    window.localStorage.setItem('zobra_user', JSON.stringify(response.body.user));

    // Auto-navigate to dashboard or customer portal to mimic UI login
    if (response.body.user.role === 'CUSTOMER') {
      cy.visit('/customer');
    } else {
      cy.visit('/dashboard');
    }
  });
});