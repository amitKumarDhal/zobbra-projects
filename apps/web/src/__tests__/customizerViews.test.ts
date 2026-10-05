import { describe, expect, it } from 'vitest';
import {
  PHOTO_BOX,
  STAGE_CANVAS_HEIGHT,
  STAGE_CANVAS_WIDTH,
  applyCustomizerViews,
  getCustomizerSideImage,
  isBackSideEnabled,
  printAreaToConfig,
} from '../lib/customizerViews';
import { TEMPLATES, getCustomizerTemplate } from '../lib/customizerTemplates';
import { pruneViews, viewsFromProduct, viewsPayload } from '../components/dashboard/CustomizerViewsEditor';

const img = (n: string) => `https://res.cloudinary.com/demo/image/upload/${n}.jpg`;
// Admin uploaded the back first: the configured views must win over the image order.
const images = [img('back'), img('front'), img('detail')];

const configured = (back: any = { enabled: true, image: img('back'), area: null }) => ({
  name: 'Polo',
  category: { slug: 't-shirts' },
  images,
  customizerViews: { front: { image: img('front'), area: { x: 0.2, y: 0.25, w: 0.5, h: 0.4 } }, back },
});

describe('customizer front/back views', () => {
  it('uses the admin-chosen photos, not the image order', () => {
    const product = configured();
    expect(getCustomizerSideImage(product, 'front')).toBe(img('front'));
    expect(getCustomizerSideImage(product, 'back')).toBe(img('back'));
    expect(isBackSideEnabled(product)).toBe(true);
  });

  it('has no back side when the admin turned it off', () => {
    const product = configured({ enabled: false, image: null, area: null });
    expect(isBackSideEnabled(product)).toBe(false);
    expect(getCustomizerSideImage(product, 'back')).toBeNull();
    const template = applyCustomizerViews(getCustomizerTemplate(product), product);
    expect(template.supportsBack).toBe(false);
    expect(template.backPrintableArea).toBeUndefined();
  });

  it('keeps the legacy behaviour for products without views', () => {
    const legacy = { name: 'Polo', category: { slug: 't-shirts' }, images };
    expect(getCustomizerSideImage(legacy, 'front')).toBe(images[0]);
    expect(getCustomizerSideImage(legacy, 'back')).toBe(images[1]);
    expect(isBackSideEnabled(legacy)).toBe(true);
    const template = getCustomizerTemplate(legacy);
    expect(applyCustomizerViews(template, legacy)).toBe(template);
    expect(getCustomizerSideImage({ images: [images[0]] }, 'back')).toBe(images[0]);
    expect(getCustomizerSideImage({ images: [] }, 'front')).toBeNull();
  });

  it('maps a print area onto the stage geometry the canvas uses', () => {
    const area = printAreaToConfig({ x: 0.2, y: 0.25, w: 0.5, h: 0.4 }, TEMPLATES.tshirt.frontPrintableArea);
    expect(area.width).toBe(Math.round(0.5 * PHOTO_BOX.width));
    expect(area.height).toBe(Math.round(0.4 * PHOTO_BOX.height));
    // The canvas centres the box at (left + styleWidth/2) of the stage: it must land on the photo box.
    const centreX = ((parseFloat(area.left) + parseFloat(area.styleWidth) / 2) / 100) * STAGE_CANVAS_WIDTH;
    const centreY = ((parseFloat(area.top) + parseFloat(area.styleHeight) / 2) / 100) * STAGE_CANVAS_HEIGHT;
    expect(centreX).toBeCloseTo(PHOTO_BOX.left + 0.45 * PHOTO_BOX.width, 5);
    expect(centreY).toBeCloseTo(PHOTO_BOX.top + 0.45 * PHOTO_BOX.height, 5);
    expect(area.label).toBe(TEMPLATES.tshirt.frontPrintableArea.label);
  });

  it('uses the template area for a side without a drawn guide', () => {
    const product = configured();
    const template = applyCustomizerViews(getCustomizerTemplate(product), product);
    expect(template.backPrintableArea).toEqual(TEMPLATES.tshirt.backPrintableArea);
    expect(template.frontPrintableArea).not.toEqual(TEMPLATES.tshirt.frontPrintableArea);
  });
});

describe('admin views form', () => {
  it('sends null until a photo is chosen and drops the back photo when the back is off', () => {
    expect(viewsPayload(viewsFromProduct(null))).toBeNull();
    const form = viewsFromProduct(configured().customizerViews);
    expect(viewsPayload({ ...form, back: { ...form.back, enabled: false } })).toEqual({
      front: { image: form.front.image, area: form.front.area, bodyMask: null, trimMask: null },
      back: { enabled: false, image: null, area: null, bodyMask: null, trimMask: null },
    });
  });

  it('sends masks per side, and drops a side’s guide and masks when its photo changes', () => {
    const form = viewsFromProduct({
      front: { image: img('front'), area: { x: 0.1, y: 0.1, w: 0.5, h: 0.5 }, bodyMask: img('fb'), trimMask: img('ft') },
      back: { enabled: true, image: img('back'), area: null, bodyMask: img('bb'), trimMask: null },
    });
    expect(viewsPayload(form)).toMatchObject({
      front: { bodyMask: img('fb'), trimMask: img('ft') },
      back: { bodyMask: img('bb'), trimMask: null },
    });
    // The back photo is removed from the product: its masks go with it, the front keeps its own.
    const pruned = pruneViews(form, [img('front')]);
    expect(pruned.front).toEqual(form.front);
    expect(pruned.back).toMatchObject({ image: '', bodyMask: '', trimMask: '', area: null });
  });

  it('clears a selection whose photo was removed from the product images', () => {
    const form = viewsFromProduct(configured().customizerViews);
    const pruned = pruneViews(form, [img('front')]);
    expect(pruned.front.image).toBe(img('front'));
    expect(pruned.back.image).toBe('');
    expect(pruneViews(form, images)).toBe(form);
  });
});
