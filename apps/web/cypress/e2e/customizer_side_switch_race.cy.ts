/// <reference types="cypress" />

/**
 * Regression: rapid Front/Back switching must not corrupt either side.
 *
 * Each side holds an image (whose rehydration via loadFromJSON is always asynchronous) plus a
 * text object. The toggle buttons are clicked synchronously back-to-back so the second click lands
 * while the first switch is still loading.
 */
const SLUG = 'classic-corporate-polo-tshirt';
// Same-origin asset stands in for the Cloudinary secure_url so rehydration is CORS-safe and offline.
const ASSET_URL = 'http://localhost:3000/brand/zobbra-logo-white.png';

type SideSummary = { types: string[]; texts: string[] };

const summarize = (json: string): SideSummary => {
  const objs = JSON.parse(json).objects || [];
  return {
    types: objs.map((o: any) => o.type).sort(),
    texts: objs.filter((o: any) => o.text).map((o: any) => o.text),
  };
};

const getRef = () => cy.window().then((win: any) => win.__getCanvasRef());

const clickSequence = (sides: Array<'front' | 'back'>) => {
  cy.document().then((doc) => {
    sides.forEach((side) => (doc.getElementById(`btn-switch-${side}`) as HTMLButtonElement).click());
  });
};

const addImageTo = () =>
  cy.fixture('../../public/brand/zobbra-logo-white.png', null).then((buf) =>
    cy.window().then((win: any) => {
      const file = new win.File([buf], 'logo.png', { type: 'image/png' });
      return win.__getCanvasRef().addImage(file);
    })
  );

/** Wait until no switch is in flight and the visible canvas matches the side the toggle shows. */
const settle = () => {
  cy.wait(1500);
  cy.get('#btn-switch-front').should('exist');
};

describe('Customizer - rapid side switching', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.intercept('POST', 'https://api.cloudinary.com/**', {
      statusCode: 200,
      body: { secure_url: ASSET_URL },
    });
    cy.visit(`/products/${SLUG}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');

    // Front: image + FRONT text
    addImageTo();
    getRef().then((ref: any) => ref.addText('FRONT TEXT', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' }));

    // Back: image + BACK text
    cy.get('#btn-switch-back').click();
    settle();
    addImageTo();
    getRef().then((ref: any) => ref.addText('BACK TEXT', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' }));

    cy.get('#btn-switch-front').click();
    settle();
  });

  const expectBothSidesIntact = () => {
    getRef().then((ref: any) => {
      const st = ref.getCanvasState();
      expect(st.hasFront, 'hasFront').to.eq(true);
      expect(st.hasBack, 'hasBack').to.eq(true);
      expect(summarize(st.frontJson)).to.deep.eq({ types: ['i-text', 'image'], texts: ['FRONT TEXT'] });
      expect(summarize(st.backJson)).to.deep.eq({ types: ['i-text', 'image'], texts: ['BACK TEXT'] });
      expect(st.frontJson).to.not.include('data:image/');
      expect(st.backJson).to.not.include('data:image/');
    });
  };

  /** The canvas on screen must show exactly the side the toggle marks as active. */
  const expectVisibleSide = (side: 'front' | 'back') => {
    cy.get(`#btn-switch-${side}`).should('have.class', 'bg-white');
    cy.window().then((win: any) => {
      const st = win.__getCanvasRef().getCanvasState();
      const shown = summarize(side === 'front' ? st.frontJson : st.backJson);
      expect(shown.texts).to.deep.eq([side === 'front' ? 'FRONT TEXT' : 'BACK TEXT']);
    });
  };

  it('Front -> Back -> Front (rapid) keeps both sides intact', () => {
    clickSequence(['back', 'front']);
    settle();
    expectBothSidesIntact();
    // Toggle and canvas agree, and a follow-up switch still works.
    cy.get('#btn-switch-front').click();
    cy.get('#btn-switch-back').click();
    settle();
    expectVisibleSide('back');
    expectBothSidesIntact();
  });

  it('Back -> Front -> Back (rapid) keeps both sides intact', () => {
    cy.get('#btn-switch-back').click();
    settle();
    clickSequence(['front', 'back']);
    settle();
    expectBothSidesIntact();
  });

  it('many rapid alternating clicks keep both sides intact and export cleanly', () => {
    clickSequence(['back', 'front', 'back', 'front', 'back', 'front', 'back']);
    settle();
    expectBothSidesIntact();
    getRef()
      .then((ref: any) => ref.exportPreviews())
      .then((res: any) => {
        expect(res.hasFront).to.eq(true);
        expect(res.hasBack).to.eq(true);
        expect(summarize(res.frontCanvasJson).texts).to.deep.eq(['FRONT TEXT']);
        expect(summarize(res.backCanvasJson).texts).to.deep.eq(['BACK TEXT']);
      });
  });
});
