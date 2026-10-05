/// <reference types="cypress" />

import { E2E_CUSTOMER } from "./e2eCustomer";

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      /** Yields the session a completed customer OTP sign-in produces, for the shared E2E customer. */
      customerSession(): Chainable<{ token: string; user: any }>
      /** Signs the shared E2E customer into the browser and opens the customer portal. */
      loginAsCustomer(): Chainable<void>
    }
  }
}

/**
 * E2E auth adapter (see cypress.config.ts).
 *
 * Only ADMIN may use POST /auth/login; everyone else signs in with WhatsApp OTP,
 * and POST /auth/register is retired (410). Existing specs still create/sign in
 * non-admin fixtures by email + password, so for those two calls only:
 *   - /auth/login: for an existing CUSTOMER, the session a completed OTP
 *     sign-in would produce is issued via cy.task (the password is not checked —
 *     the API no longer accepts it). ADMIN and unknown emails hit the real API.
 *   - /auth/register: a passwordless CUSTOMER is created via cy.task.
 * Every other request passes straight through.
 */
const AUTH_LOGIN_URL = /\/api\/v1\/auth\/login\/?$/;
const AUTH_REGISTER_URL = /\/api\/v1\/auth\/register\/?$/;

function requestOptions(args: any[]): Record<string, any> | null {
  if (args[0] && typeof args[0] === 'object') return args[0];
  if (typeof args[0] === 'string' && /^(GET|POST|PUT|PATCH|DELETE)$/i.test(args[0])) {
    return { method: args[0], url: args[1], body: args[2] };
  }
  return null;
}

function asResponse(result: { status: number; body: any }, failOnStatusCode: boolean, url: string) {
  if (failOnStatusCode && result.status >= 400) {
    throw new Error(`cy.request POST ${url} failed with ${result.status}: ${JSON.stringify(result.body)}`);
  }
  return { status: result.status, body: result.body, headers: {}, isOkStatusCode: result.status < 400 };
}

Cypress.Commands.overwrite('request', ((originalFn: any, ...args: any[]) => {
  const opts = requestOptions(args);
  if (!opts || String(opts.method || 'GET').toUpperCase() !== 'POST') return originalFn(...args);

  const url = String(opts.url);
  const failOnStatusCode = opts.failOnStatusCode !== false;

  if (AUTH_REGISTER_URL.test(url)) {
    return cy
      .task('e2eCreateCustomer', opts.body || {}, { log: false })
      .then((result: any) => asResponse(result, failOnStatusCode, url));
  }

  if (AUTH_LOGIN_URL.test(url)) {
    // Existing non-admin fixture → OTP-equivalent session. Anything else (ADMIN,
    // unknown email) goes to the real API unchanged.
    return cy
      .task('e2eSessionForEmail', { email: opts.body?.email }, { log: false })
      .then((session: any) =>
        session
          ? asResponse({ status: 200, body: { success: true, ...session } }, failOnStatusCode, url)
          : originalFn(...args)
      );
  }

  return originalFn(...args);
}) as any);

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

/**
 * Shared E2E customer. Customer sign-in is WhatsApp OTP, which cannot be completed in an
 * automated run, so (like the request overrides above) the session a completed OTP sign-in
 * issues comes from the runner's cy.task adapter. The customer is created on demand through
 * the same adapter and no password is involved.
 */
Cypress.Commands.add('customerSession', () => {
  return cy
    .task('e2eCreateCustomer', E2E_CUSTOMER, { log: false }) // 201 on first use, 400 "already exists" afterwards
    .then(() => cy.task('e2eSessionForEmail', { email: E2E_CUSTOMER.email }, { log: false }))
    .then((session: any) => {
      expect(session, 'E2E customer session').to.have.property('token');
      return session as { token: string; user: any };
    });
});

Cypress.Commands.add('loginAsCustomer', () => {
  cy.customerSession().then((session) => {
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('token', session.token);
      win.localStorage.setItem('zobra_token', session.token);
      win.localStorage.setItem('user', JSON.stringify(session.user));
      win.localStorage.setItem('zobra_user', JSON.stringify(session.user));
    });
    cy.visit('/customer');
  });
});
