/// <reference types="cypress" />

/**
 * Free placement: artwork can be positioned anywhere on the product stage, while stored canvas
 * coordinates stay in the legacy printable-box space (so existing drafts render unchanged).
 * T-shirt legacy box is 210 x 300 with its center at (105, 150).
 */
const SLUG = 'classic-corporate-polo-tshirt';
const FAKE_CDN = 'https://res.cloudinary.com/demo/image/upload/v1/zobbra/designs/preview.png';

function pngSize(dataUrl: string): { width: number; height: number } {
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, '').slice(0, 44);
  const bin = atob(b64.slice(0, 44 - (44 % 4)));
  const u32 = (o: number) =>
    ((bin.charCodeAt(o) << 24) | (bin.charCodeAt(o + 1) << 16) | (bin.charCodeAt(o + 2) << 8) | bin.charCodeAt(o + 3)) >>> 0;
  return { width: u32(16), height: u32(20) };
}

describe('Customizer - free placement, drafts and export', () => {
  const uploaded: string[] = [];

  const getRef = () => cy.window().then((win: any) => win.__getCanvasRef());
  const state = () => getRef().then((ref: any) => ref.getCanvasState());
  const firstText = (json: string) => JSON.parse(json).objects[0];

  beforeEach(() => {
    uploaded.length = 0;
    cy.viewport(1280, 800);
    cy.intercept('POST', 'https://api.cloudinary.com/**', (req) => {
      const match = String(req.body).match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
      if (match) uploaded.push(match[0]);
      req.reply({ statusCode: 200, body: { secure_url: FAKE_CDN } });
    }).as('cloudinary');
    cy.visit(`/products/${SLUG}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
  });

  it('canvas covers the whole stage and has no dashed boundary', () => {
    cy.get('#customizer-canvas-wrapper canvas.lower-canvas').should(($c) => {
      expect(Number($c.attr('width'))).to.be.at.least(538);
      expect(Number($c.attr('height'))).to.be.at.least(624);
    });
    cy.get('svg[viewBox="0 0 500 580"] rect[stroke-dasharray]').should('not.exist');
  });

  it('keeps coordinates outside the legacy box (no clipping in stored state)', () => {
    getRef().then((ref: any) => {
      ref.addText('EDGE', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: -140, top: 420 });
    });
    state().then((s: any) => {
      const t = firstText(s.frontJson);
      expect(t.left).to.be.closeTo(-140, 0.5);
      expect(t.top).to.be.closeTo(420, 0.5);
    });
  });

  it('Center re-bases to the product design center, not the enlarged canvas', () => {
    getRef().then((ref: any) => {
      ref.addText('MID', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: 10, top: 20 });
      ref.centerActiveH();
      ref.centerActiveV();
    });
    state().then((s: any) => {
      const t = firstText(s.frontJson);
      expect(t.left).to.be.closeTo(105, 0.5);
      expect(t.top).to.be.closeTo(150, 0.5);
    });
  });

  it('preview export is the legacy 210x300 (x2) box for in-box designs', () => {
    getRef().then((ref: any) => {
      ref.addText('IN', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
    });
    getRef()
      .then((ref: any) => ref.exportPreviews())
      .then((res: any) => {
        expect(res.hasFront).to.eq(true);
        expect(res.frontCloudinaryUrl).to.eq(FAKE_CDN);
        expect(uploaded).to.have.length(1);
        const { width, height } = pngSize(uploaded[0]);
        expect(width).to.eq(420);
        expect(height).to.eq(600);
      });
  });

  it('preview export grows (never crops) when a design is moved outside the box', () => {
    getRef().then((ref: any) => {
      ref.addText('OUTSIDE', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: -100, top: -50 });
    });
    getRef()
      .then((ref: any) => ref.exportPreviews())
      .then(() => {
        expect(uploaded).to.have.length(1);
        const { width, height } = pngSize(uploaded[0]);
        expect(width).to.be.greaterThan(420);
        expect(height).to.be.greaterThan(600);
      });
  });

  it('front/back keep independent designs through switching and export', () => {
    getRef().then((ref: any) => {
      ref.addText('FRONT1', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
    });
    cy.get('#btn-switch-back').click();
    getRef().then((ref: any) => {
      ref.addText('BACK1', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: 300, top: 320 });
    });
    cy.get('#btn-switch-front').click();
    state().then((s: any) => {
      expect(s.hasFront).to.eq(true);
      expect(s.hasBack).to.eq(true);
      expect(firstText(s.frontJson).text).to.eq('FRONT1');
      expect(firstText(s.backJson).text).to.eq('BACK1');
      expect(firstText(s.backJson).left).to.be.closeTo(300, 0.5);
    });
    getRef()
      .then((ref: any) => ref.exportPreviews())
      .then((res: any) => {
        expect(res.frontCloudinaryUrl).to.eq(FAKE_CDN);
        expect(res.backCloudinaryUrl).to.eq(FAKE_CDN);
        expect(res.frontCanvasJson).to.not.include('data:image/');
        expect(res.backCanvasJson).to.not.include('data:image/');
      });
    // active side is restored after the export round-trip
    state().then((s: any) => expect(firstText(s.frontJson).text).to.eq('FRONT1'));
  });
});


describe('Customizer - draft restore', () => {
  it('restores a draft (box-relative coordinates, as saved before this redesign) unchanged', () => {
    cy.viewport(1280, 800);

    // 1. Produce a draft with the real serializer: text at the legacy box center.
    cy.visit(`/products/${SLUG}/customize`);
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
    cy.window().then((win: any) => {
      const ref = win.__getCanvasRef();
      ref.addText('LEGACY', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: 105, top: 150 });
      const st = ref.getCanvasState();
      return cy.request(`http://localhost:5000/api/v1/products/${SLUG}`).then((res) => {
        const product = res.body.product || res.body.data || res.body;
        const draft = {
          draftId: 'draft_legacy_test',
          productId: product.id,
          productName: product.name,
          selectedColor: 'White',
          collarColor: 'Yellow',
          frontCanvasJson: st.frontJson,
          quantity: 50,
          printPosition: 'Front Only',
          variants: [{ color: 'White', size: 'L', quantity: 50 }],
          timestamp: Date.now(),
        };
        win.localStorage.setItem(`zobbra_customizer_draft_v1_${product.id}`, JSON.stringify(draft));
      });
    });

    // 2. Resume from that draft in a fresh page load.
    cy.visit(`/products/${SLUG}/customize?resume=1`);
    cy.contains('Restored your saved design draft').should('be.visible');
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
    cy.window().should((win: any) => {
      const st = win.__getCanvasRef().getCanvasState();
      expect(st.hasFront).to.eq(true);
      const t = JSON.parse(st.frontJson).objects[0];
      expect(t.text).to.eq('LEGACY');
      expect(t.left).to.be.closeTo(105, 0.5);
      expect(t.top).to.be.closeTo(150, 0.5);
    });
  });
});

/**
 * Pointer math must stay correct under the CSS-scaled stage (small on mobile, larger on desktop):
 * dragging N screen pixels must move the object by N / scale canvas units.
 */
describe('Customizer - drag under scaled stage', () => {
  const dragCheck = () => {
    cy.get('#customizer-canvas-wrapper[data-canvas-ready="true"]', { timeout: 20000 }).should('exist');
    cy.window().then((win: any) => {
      const ref = win.__getCanvasRef();
      ref.addText('DRAG', { fontFamily: 'Inter', fontSize: 24, fill: '#111111' });
      ref.updateActiveObject({ left: 105, top: 150 });
    });
    cy.get('#customizer-canvas-wrapper canvas.upper-canvas').then(($c) => {
      const rect = $c[0].getBoundingClientRect();
      const scale = rect.width / 538;
      // T-shirt legacy box origin inside the stage canvas
      const originX = (0.29 + 0.42 / 2) * 538 - 105;
      const originY = (0.224 + 0.52 / 2) * 624 - 150;
      const startX = rect.left + (originX + 105) * scale;
      const startY = rect.top + (originY + 150) * scale;
      const dx = 60;
      const dy = -40;
      const ev = { button: 0, which: 1, buttons: 1, force: true } as any;
      cy.wrap($c).trigger('mousedown', { ...ev, clientX: startX, clientY: startY });
      cy.document().trigger('mousemove', { ...ev, clientX: startX + dx / 2, clientY: startY + dy / 2 });
      cy.document().trigger('mousemove', { ...ev, clientX: startX + dx, clientY: startY + dy });
      cy.document().trigger('mouseup', { ...ev, buttons: 0, clientX: startX + dx, clientY: startY + dy });
      cy.window().should((win: any) => {
        const t = JSON.parse(win.__getCanvasRef().getCanvasState().frontJson).objects[0];
        expect(t.left, 'left').to.be.closeTo(105 + dx / scale, 2);
        expect(t.top, 'top').to.be.closeTo(150 + dy / scale, 2);
      });
    });
  };

  it('desktop scale', () => {
    cy.viewport(1280, 800);
    cy.visit(`/products/${SLUG}/customize`);
    dragCheck();
  });

  it('mobile scale', () => {
    cy.viewport(390, 844);
    cy.visit(`/products/${SLUG}/customize`);
    dragCheck();
  });
});
