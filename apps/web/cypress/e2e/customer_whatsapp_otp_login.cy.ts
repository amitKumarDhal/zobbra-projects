/**
 * Customer WhatsApp OTP sign-in — UI journey.
 *
 * WhatsApp delivery is not available in CI, so the two OTP endpoints are
 * stubbed with cy.intercept. The verify stub returns a real session for the
 * seeded customer so the post-login portal renders with genuine data.
 * Server-side OTP security is covered by server/tests/otpAuth.test.ts.
 */


describe('Customer WhatsApp OTP login', () => {
  let session: { token: string; user: any };

  before(() => {
    cy.customerSession().then((customerSession) => {
      session = customerSession;
    });
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('POST', '**/auth/otp/request', {
      statusCode: 200,
      body: { success: true, message: 'A 6-digit code has been sent to your WhatsApp.', expiresIn: 300, resendIn: 30 },
    }).as('otpRequest');
  });

  const sendOtpTo = (number: string) => {
    cy.get('[data-cy="otp-phone-input"]').type(number);
    cy.get('[data-cy="otp-send-button"]').should('not.be.disabled').click();
    cy.wait('@otpRequest').its('request.body').should('deep.equal', { phone: '+919876543210' });
    cy.get('[data-cy="otp-code-step"]').should('be.visible');
  };

  const typeOtp = (code: string) => {
    cy.get('[data-cy="otp-digit-0"]').type(code); // first box accepts the full code (autofill/paste)
  };

  it('enter number → send OTP → verify → customer portal', () => {
    cy.intercept('POST', '**/auth/otp/verify', (req) => {
      expect(req.body).to.deep.equal({ phone: '+919876543210', otp: '123456' });
      req.reply({ statusCode: 200, body: { success: true, ...session } });
    }).as('otpVerify');

    cy.visit('/login');
    sendOtpTo('98765 43210');

    cy.get('[data-cy="otp-sent-to"]').should('have.text', '+91 98765 43210');
    cy.get('[data-cy="otp-resend-timer"]').should('contain', 'Resend OTP in');

    typeOtp('123456');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@otpVerify');

    cy.url({ timeout: 10000 }).should('include', '/customer');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq(session.token);
      expect(JSON.parse(win.localStorage.getItem('user') || '{}').role).to.eq('CUSTOMER');
    });
  });

  it('shows an error for a wrong OTP and stays on the code screen', () => {
    cy.intercept('POST', '**/auth/otp/verify', {
      statusCode: 400,
      body: { success: false, message: 'Incorrect code. Please check and try again.', attemptsRemaining: 4 },
    }).as('otpVerify');

    cy.visit('/login');
    sendOtpTo('9876543210');
    typeOtp('000000');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@otpVerify');

    cy.get('[data-cy="otp-error"]').should('contain', 'Incorrect code');
    cy.get('[data-cy="otp-code-step"]').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('lets the customer change the number', () => {
    cy.visit('/login');
    sendOtpTo('9876543210');
    cy.get('[data-cy="otp-change-number"]').click();
    cy.get('[data-cy="otp-phone-step"]').should('be.visible');
    cy.get('[data-cy="otp-phone-input"]').should('have.value', '9876543210');
  });

  it('offers resend once the timer runs out', () => {
    cy.clock();
    cy.visit('/login');
    cy.get('[data-cy="otp-phone-input"]').type('9876543210');
    cy.get('[data-cy="otp-send-button"]').click();
    cy.wait('@otpRequest');
    cy.get('[data-cy="otp-resend-timer"]').should('contain', '30s');

    cy.tick(31000);
    cy.get('[data-cy="otp-resend-button"]').should('be.visible').click();
    cy.wait('@otpRequest');
    cy.get('[data-cy="otp-resend-timer"]').should('contain', '30s');
  });

  it('returns to the intended destination after authentication', () => {
    cy.intercept('POST', '**/auth/otp/verify', { statusCode: 200, body: { success: true, ...session } }).as('otpVerify');

    cy.visit(`/login?returnUrl=${encodeURIComponent('/customer/quotes')}`);
    sendOtpTo('9876543210');
    typeOtp('123456');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@otpVerify');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/customer/quotes');
  });

  it('is usable on a phone-sized screen without horizontal scrolling', () => {
    cy.viewport('iphone-x');
    cy.visit('/login');
    cy.get('[data-cy="otp-phone-input"]').should('be.visible');
    cy.get('[data-cy="otp-send-button"]').should('be.visible');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });

    sendOtpTo('9876543210');
    for (let i = 0; i < 6; i++) cy.get(`[data-cy="otp-digit-${i}"]`).should('be.visible');
    cy.get('[data-cy="otp-verify-button"]').should('be.visible');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  });

  it('keeps a small secondary Admin Login link', () => {
    cy.visit('/login');
    cy.get('[data-cy="admin-login-link"]').should('contain', 'Admin Login').and('have.attr', 'href', '/login?mode=admin');
  });
});
