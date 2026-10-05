import { normalizeProductConfig, toPublicProduct } from '../src/modules/products/product-config.js';

const url = (file: string) => `https://res.cloudinary.com/demo/image/upload/v1/zobbra/${file}`;
const images = [url('front.jpg'), url('back.jpg'), url('detail.jpg')];

describe('customizer front/back views', () => {
  it('stores the chosen front and back photos with rounded print areas', () => {
    const data = normalizeProductConfig({
      images,
      customizerViews: {
        front: { image: images[0], area: { x: 0.25, y: 0.2, w: 0.5, h: 0.45678912 } },
        back: { enabled: true, image: images[1], area: null },
      },
    });
    expect(data.customizerViews).toEqual({
      front: { image: images[0], area: { x: 0.25, y: 0.2, w: 0.5, h: 0.4568 }, bodyMask: null, trimMask: null },
      back: { enabled: true, image: images[1], area: null, bodyMask: null, trimMask: null },
    });
  });

  it('allows the back to be turned off and drops any back photo', () => {
    const data = normalizeProductConfig({
      images,
      customizerViews: { front: { image: images[2] }, back: { enabled: false, image: images[1], area: { x: 0, y: 0, w: 1, h: 1 } } },
    });
    expect(data.customizerViews).toEqual({
      front: { image: images[2], area: null, bodyMask: null, trimMask: null },
      back: { enabled: false, image: null, area: null, bodyMask: null, trimMask: null },
    });
  });

  it('stores null when no photo is chosen, so older products keep the legacy photo order', () => {
    expect(normalizeProductConfig({ customizerViews: null }).customizerViews).toBeNull();
    expect(
      normalizeProductConfig({ customizerViews: { front: { image: '' }, back: { enabled: true, image: '' } } }).customizerViews
    ).toBeNull();
    expect(normalizeProductConfig({ images })).not.toHaveProperty('customizerViews');
  });

  it('rejects an enabled back without a photo, and a photo that is not one of the product images', () => {
    expect(() =>
      normalizeProductConfig({ customizerViews: { front: { image: images[0] }, back: { enabled: true, image: '' } } })
    ).toThrow(/back image/i);
    expect(() =>
      normalizeProductConfig({ images: [images[0]], customizerViews: { front: { image: images[0] }, back: { enabled: true, image: images[1] } } })
    ).toThrow(/must be one of the product images/);
    expect(() =>
      normalizeProductConfig({ customizerViews: { front: { image: 'data:image/png;base64,xx' }, back: { enabled: false } } })
    ).toThrow(/front image/i);
  });

  it('rejects print areas outside the 0..1 photo box or too small to use', () => {
    const withArea = (area: any) => () =>
      normalizeProductConfig({ customizerViews: { front: { image: images[0], area }, back: { enabled: false } } });
    expect(withArea({ x: -0.1, y: 0, w: 0.5, h: 0.5 })).toThrow(/between 0 and 1/);
    expect(withArea({ x: 0.8, y: 0, w: 0.5, h: 0.5 })).toThrow(/inside the photo/);
    expect(withArea({ x: 0.1, y: 0.1, w: 0.01, h: 0.5 })).toThrow(/too small/);
  });

  it('stores body and collar/rib masks per side; masks need not be product images', () => {
    const data = normalizeProductConfig({
      images,
      customizerViews: {
        front: { image: images[0], bodyMask: url('front-body.png'), trimMask: ' ' + url('front-trim.png') + ' ' },
        back: { enabled: true, image: images[1], bodyMask: url('back-body.png'), trimMask: '' },
      },
    });
    expect(data.customizerViews.front).toMatchObject({ bodyMask: url('front-body.png'), trimMask: url('front-trim.png') });
    expect(data.customizerViews.back).toMatchObject({ bodyMask: url('back-body.png'), trimMask: null });
    expect(() =>
      normalizeProductConfig({ customizerViews: { front: { image: images[0], trimMask: 'data:image/png;base64,xx' }, back: { enabled: false } } })
    ).toThrow('collar/rib mask');
  });

  it('is returned to customers unchanged', () => {
    const views = { front: { image: images[0], area: null }, back: { enabled: false, image: null, area: null } };
    const product = toPublicProduct({ basePrice: 100, images, customizerViews: views, variants: [], bulkPricing: [] });
    expect(product.customizerViews).toEqual(views);
  });
});
