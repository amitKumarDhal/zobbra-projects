/// <reference types="cypress" />

/**
 * Guest → browse → product → customize → Proceed → checkout → Request quote → WhatsApp OTP → quote.
 *
 * Authentication is only asked for at Request quote, on the customizer page itself, and the guest's
 * design (colour, text, uploaded artwork, sizes, quantity, addon) survives it.
 *
 * The OTP request/verify calls are stubbed (the real code is only printed in the API server's
 * console in development); verify answers with the session the API issues for a real CUSTOMER,
 * so the quote afterwards is created by the real API. The OTP endpoints themselves are covered
 * by server/tests/otpAuth.test.ts.
 */
const API = 'http://localhost:5000/api/v1';
const RUN = Date.now();
const CUSTOMER_EMAIL = 'dev-product-flow-customer@zobra.test';
const ARTWORK_URL = `https://res.cloudinary.com/demo/image/upload/v${RUN}/zobbra/designs/guest_logo.png`;
const DRAFT_KEY = 'zobbra_customizer_draft_v1';

const PRODUCT = {
  name: `E2E Guest OTP Polo ${RUN}`,
  slug: `e2e-guest-otp-polo-${RUN}`,
  description: 'Guest customizer OTP flow test product',
  basePrice: 300,
  minOrderQty: 10,
  orderMode: 'BOTH',
  requiresSize: true,
  sizes: ['S', 'M', 'L'],
  colors: [
    { name: 'Navy Blue', hex: '#0D1333' },
    { name: 'Classic White', hex: '#F9FAFB' },
  ],
  bulkPricing: [{ minQuantity: 10, maxQuantity: '', pricePerUnit: 250 }],
  freeGift: { enabled: true, title: 'Free sticker pack' },
  offerAddon: { enabled: true, title: 'Premium gift box', price: 100, priceType: 'PER_ORDER' },
  isActive: true,
};

let adminSession: { token: string; user: any };
let customerSession: { token: string; user: any };
let product: any;

const setSession = (win: Window, s: { token: string; user: any }) => {
  win.localStorage.setItem('token', s.token);
  win.localStorage.setItem('zobra_token', s.token);
  win.localStorage.setItem('user', JSON.stringify(s.user));
  win.localStorage.setItem('zobra_user', JSON.stringify(s.user));
};

const canvasReady = () => cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 30000 }).should('exist');
const frontTexts = (win: any): string[] =>
  JSON.parse(win.__getCanvasRef().getCanvasState().frontJson).objects.map((o: any) => o.text).filter(Boolean);

/** OTP endpoints: request succeeds; verify rejects `wrongAttempts` times, then signs the customer in. */
const stubOtp = (wrongAttempts = 0) => {
  let wrong = wrongAttempts;
  cy.intercept('POST', `${API}/auth/otp/request`, { success: true, resendIn: 2, expiresIn: 300 }).as('otpRequest');
  cy.intercept('POST', `${API}/auth/otp/verify`, (req) => {
    expect(req.body).to.have.keys(['phone', 'otp']); // the browser never sends a role or user id
    if (wrong > 0) {
      wrong -= 1;
      req.reply({ statusCode: 400, body: { success: false, message: 'Incorrect code. 4 attempts remaining.' } });
    } else {
      req.reply({ success: true, token: customerSession.token, user: customerSession.user });
    }
  }).as('otpVerify');
};

const enterPhoneAndSend = () => {
  cy.get('[data-cy="otp-phone-input"]').type('9876500011');
  cy.get('[data-cy="otp-send-button"]').click();
  cy.wait('@otpRequest').its('request.body').should('deep.eq', { phone: '+919876500011' });
  cy.get('[data-cy="otp-code-step"]').should('be.visible');
};

const typeOtp = (code: string) => code.split('').forEach((d, i) => cy.get(`[data-cy="otp-digit-${i}"]`).type(d));

/** Guest design: second colour, text, and an uploaded logo (Cloudinary upload stubbed). */
const customizeAsGuest = () => {
  cy.intercept('POST', 'https://api.cloudinary.com/**', {
    statusCode: 200,
    body: { secure_url: ARTWORK_URL, public_id: 'zobbra/designs/guest_logo', format: 'png', width: 500, height: 500 },
  }).as('cloudinary');

  cy.get('#tab-tool-colors').click();
  cy.get('[data-cy="customizer-body-colors"] button[title="Classic White"]').click();
  cy.window().then((win: any) => win.__getCanvasRef().addText('GUEST TEAM', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' }));
  cy.get('#tab-tool-logo').click();
  cy.get('input[type="file"]').selectFile('public/brand/zobbra-logo-white.png', { force: true });
  cy.wait('@cloudinary');
  cy.get('#customizer-proceed-btn').should('not.be.disabled').and('contain', 'Proceed');
};

/** Guest: Proceed opens the checkout step with no login; Request quote asks for the OTP. */
const proceedToOtp = () => {
  cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
  cy.get('#customizer-review-sheet').should('be.visible');
  cy.get('#customizer-auth-modal').should('not.exist');
  cy.get('#customizer-confirm-btn').should('not.be.disabled').click();
  cy.get('#customizer-auth-modal').should('be.visible');
};

describe('Guest customizer → checkout → WhatsApp OTP at Request quote', { defaultCommandTimeout: 20000 }, () => {
  before(() => {
    cy.request('POST', `${API}/auth/login`, { email: 'admin@zobra.test', password: 'admin123' }).then((res) => {
      adminSession = { token: res.body.token, user: res.body.user };
      cy.request(`${API}/products/categories`).then((cats) => {
        const category = cats.body.categories.find((c: any) => c.slug === 't-shirts') || cats.body.categories[0];
        cy.request({
          method: 'POST',
          url: `${API}/products`,
          headers: { Authorization: `Bearer ${adminSession.token}` },
          body: { ...PRODUCT, categoryId: category.id },
        }).then((created) => {
          product = created.body.product;
        });
      });
    });
    cy.task('e2eSessionForEmail', { email: CUSTOMER_EMAIL }).then((existing: any) => {
      if (existing) {
        customerSession = existing;
        return;
      }
      cy.task('e2eCreateCustomer', { name: 'Dev Product Flow Customer', email: CUSTOMER_EMAIL }).then((created: any) => {
        customerSession = { token: created.body.token, user: created.body.user };
      });
    });
  });

  after(() => {
    cy.task('e2eDeleteTestProduct', { productId: product?.id });
  });

  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.clearAllCookies();
  });

  it('guest browses, opens the customizer from the catalog, and designs without being asked to log in', () => {
    cy.visit(`/products?category=t-shirts`);
    cy.get(`[data-cy="product-card-${PRODUCT.slug}"]`).should('be.visible').contains('button', 'CUSTOMIZE').click();

    cy.location('pathname').should('eq', `/products/${product.id}/customize`);
    canvasReady();
    cy.get('#customizer-auth-modal').should('not.exist');
    customizeAsGuest();

    cy.get('#customizer-auth-modal').should('not.exist');
    cy.window().then((win: any) => {
      expect(win.localStorage.getItem('token')).to.eq(null);
      expect(frontTexts(win)).to.deep.eq(['GUEST TEAM']);
    });
    cy.location('pathname').should('eq', `/products/${product.id}/customize`);
  });

  it('full guest journey: Proceed → checkout → Request quote → OTP (wrong code, resend, correct code) → quote, with the design intact', () => {
    stubOtp(1);
    cy.intercept('POST', `${API}/quotes`).as('createQuote');
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`);
    canvasReady();
    customizeAsGuest();

    // Proceed as a guest: checkout opens with no login prompt
    cy.get('#customizer-proceed-btn').click();
    cy.get('#customizer-review-sheet').should('be.visible');
    cy.get('#customizer-auth-modal').should('not.exist');

    // Checkout: sizes, quantity, free gift, addon — estimated from the product's own pricing
    cy.get('[data-cy="review-color"]').should('have.text', 'Classic White');
    cy.get('[data-cy="review-size-qty-S"]').clear().type('4');
    cy.get('[data-cy="review-size-qty-M"]').clear().type('6');
    cy.get('[data-cy="review-size-qty-L"]').clear().type('5');
    cy.get('[data-cy="review-total-qty"]').should('contain', 'Total: 15 pcs');
    cy.get('[data-cy="review-unit-price"]').should('contain', '₹250');
    cy.get('[data-cy="review-free-gift"]').should('contain', 'Free sticker pack');
    cy.get('[data-cy="review-addon-checkbox"]').check();
    cy.get('[data-cy="review-subtotal"]').should('contain', '₹3,850'); // 15 × 250 + 100

    // Request quote as a guest: OTP UI on the same page, nothing submitted, design saved to the guest draft
    cy.get('#customizer-confirm-btn').should('not.be.disabled').click();
    cy.get('#customizer-auth-modal').should('be.visible').and('contain', 'Verify your mobile number to continue');
    cy.location('pathname').should('eq', `/products/${product.id}/customize`);
    cy.get('#customizer-auth-modal').find('input[type="email"], input[type="password"]').should('not.exist');
    cy.get('#customizer-auth-modal').should('not.contain', 'Password').and('not.contain', 'Email');
    cy.get('#customizer-auth-modal select').should('have.length', 1); // country code only — no role choice
    cy.get('@createQuote.all').should('have.length', 0);
    cy.window().then((win: any) => {
      const draft = JSON.parse(win.localStorage.getItem(`${DRAFT_KEY}_${product.id}`));
      expect(draft.productId).to.eq(product.id);
      expect(draft.selectedColor).to.eq('Classic White');
      expect(draft.originalArtworkUrl).to.eq(ARTWORK_URL);
      expect(draft.frontCanvasJson).to.include('GUEST TEAM').and.include(ARTWORK_URL);
      expect(draft.frontCanvasJson).to.not.include('data:image/');
    });

    // Closing the OTP UI returns to checkout with the order and customization intact
    cy.contains('button', 'Keep editing my design').click();
    cy.get('#customizer-auth-modal').should('not.exist');
    cy.get('[data-cy="review-total-qty"]').should('contain', 'Total: 15 pcs');
    cy.window().then((win: any) => expect(frontTexts(win)).to.deep.eq(['GUEST TEAM']));

    // Request quote again → request OTP
    cy.get('#customizer-confirm-btn').click();
    enterPhoneAndSend();

    // Wrong code: stays in the authentication step
    typeOtp('000000');
    cy.get('[data-cy="otp-verify-button"]').should('contain', 'Verify & Continue').click();
    cy.wait('@otpVerify');
    cy.get('[data-cy="otp-error"]').should('contain', 'Incorrect code');
    cy.get('#customizer-auth-modal').should('be.visible');
    cy.window().then((win: any) => expect(win.localStorage.getItem('token')).to.eq(null));

    // Resend becomes available after the cooldown
    cy.get('[data-cy="otp-resend-button"]', { timeout: 8000 }).click();
    cy.wait('@otpRequest');

    // Correct code → signed in as CUSTOMER and the reviewed quote is placed without another click
    typeOtp('123456');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@otpVerify');
    cy.get('#customizer-auth-modal').should('not.exist');
    cy.wait('@createQuote', { timeout: 60000 }).then(({ request, response }) => {
      expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(201);
      // The browser sends no identity; the server takes it from the verified JWT
      expect(request.body).to.not.have.any.keys('customerId', 'companyId', 'userId');
      expect(request.headers.authorization).to.eq(`Bearer ${customerSession.token}`);
      const quote = response!.body.quote;
      expect(quote.customerId).to.eq(customerSession.user.id);
      expect(quote.items[0].productId).to.eq(product.id);
      expect(quote.items[0].color).to.eq('Classic White');
      expect(quote.items[0].quantity).to.eq(15);
      expect(quote.items[0].variants.map((v: any) => [v.color, v.size, v.quantity])).to.deep.eq([
        ['Classic White', 'S', 4],
        ['Classic White', 'M', 6],
        ['Classic White', 'L', 5],
      ]);
      expect(quote.artworkUrl, 'guest artwork is attached, not re-uploaded').to.eq(ARTWORK_URL);
      expect(quote.canvasStateJson).to.include('GUEST TEAM').and.include(ARTWORK_URL);
      expect(quote.addonTitle).to.eq('Premium gift box');
      expect(quote.addonAmount).to.eq(100);
      expect(quote.freeGiftTitle).to.eq('Free sticker pack');
      expect(quote.subtotal).to.eq(3850);
    });
    cy.window().then((win: any) => {
      expect(win.localStorage.getItem('token')).to.eq(customerSession.token);
      expect(JSON.parse(win.localStorage.getItem('user')).role).to.eq('CUSTOMER');
    });

    // Lands on the customer's quotes — never /login or /dashboard
    cy.location('pathname', { timeout: 30000 }).should('eq', '/customer/quotes');
    cy.window().then((win: any) => expect(win.localStorage.getItem(`${DRAFT_KEY}_${product.id}`)).to.eq(null));
  });

  it('nothing is uploaded for a guest until they verify', () => {
    stubOtp();
    let artworkUploads = 0;
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`);
    canvasReady();
    customizeAsGuest();
    cy.intercept('POST', 'https://api.cloudinary.com/**', (req) => {
      artworkUploads += 1;
      req.reply({ secure_url: ARTWORK_URL, public_id: 'zobbra/designs/x', format: 'png', width: 500, height: 500 });
    });
    proceedToOtp();
    enterPhoneAndSend();
    cy.then(() => expect(artworkUploads, 'no Cloudinary upload between Proceed and the OTP step').to.eq(0));
  });

  it('an already signed-in customer goes straight to checkout with no OTP prompt', () => {
    cy.intercept('POST', `${API}/auth/otp/request`).as('otpRequest');
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`, { onBeforeLoad: (win) => setSession(win, customerSession) });
    canvasReady();
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.get('#customizer-review-sheet').should('be.visible');
    cy.get('#customizer-auth-modal').should('not.exist');
    cy.get('@otpRequest.all').should('have.length', 0);
  });

  it('a signed-in admin is not offered the customer OTP and keeps the admin session', () => {
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`, { onBeforeLoad: (win) => setSession(win, adminSession) });
    canvasReady();
    cy.get('#customizer-proceed-btn').should('not.be.disabled').click();
    cy.get('#customizer-auth-modal').should('not.exist');
    cy.get('#customizer-review-sheet').should('not.exist');
    cy.contains('[role="alert"]', 'signed in as Admin').should('be.visible');
    cy.window().then((win: any) => {
      expect(win.localStorage.getItem('token')).to.eq(adminSession.token);
      expect(JSON.parse(win.localStorage.getItem('user')).role).to.eq('ADMIN');
    });
  });

  it('a non-customer account returned by verification is never stored as the session', () => {
    cy.intercept('POST', `${API}/auth/otp/request`, { success: true, resendIn: 30, expiresIn: 300 }).as('otpRequest');
    cy.intercept('POST', `${API}/auth/otp/verify`, { success: true, token: adminSession.token, user: adminSession.user });
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`);
    canvasReady();
    cy.intercept('POST', `${API}/quotes`).as('createQuote');
    proceedToOtp();
    enterPhoneAndSend();
    typeOtp('123456');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.get('[data-cy="customizer-auth-notice"]').should('be.visible');
    cy.get('@createQuote.all').should('have.length', 0);
    cy.window().then((win: any) => expect(win.localStorage.getItem('token')).to.eq(null));
  });

  it('mobile: Proceed → checkout → Request quote → OTP sheet → quote, with the design intact and no horizontal scroll', () => {
    stubOtp();
    cy.intercept('POST', `${API}/quotes`).as('createQuote');
    cy.viewport(390, 844);
    cy.visit(`/products/${product.id}/customize`);
    canvasReady();
    cy.window().then((win: any) => win.__getCanvasRef().addText('MOBILE', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' }));
    proceedToOtp();
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.lte(doc.documentElement.clientWidth));
    cy.screenshot('guest-otp-mobile');
    cy.window().then((win: any) => expect(frontTexts(win)).to.deep.eq(['MOBILE']));
    enterPhoneAndSend();
    typeOtp('123456');
    cy.get('[data-cy="otp-verify-button"]').click();
    cy.wait('@createQuote', { timeout: 60000 })
      .its('response.body.quote.canvasStateJson')
      .should('include', 'MOBILE');
    cy.location('pathname', { timeout: 30000 }).should('eq', '/customer/quotes');
  });

  it('desktop screenshot of the OTP step', () => {
    stubOtp();
    cy.viewport(1280, 800);
    cy.visit(`/products/${product.id}/customize`);
    canvasReady();
    proceedToOtp();
    cy.screenshot('guest-otp-desktop-phone');
    enterPhoneAndSend();
    cy.screenshot('guest-otp-desktop-code');
  });
});
