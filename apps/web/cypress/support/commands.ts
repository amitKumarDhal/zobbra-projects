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
    
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('token', response.body.token);
      win.localStorage.setItem('zobra_token', response.body.token);
      win.localStorage.setItem('user', JSON.stringify(response.body.user));
      win.localStorage.setItem('zobra_user', JSON.stringify(response.body.user));
    });

    if (response.body.user.role === 'CUSTOMER') {
      cy.visit('/customer');
    } else {
      cy.visit('/dashboard');
    }
  });
});