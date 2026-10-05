import { normalizeProductConfig } from '../src/modules/products/product-config.js';

const url = (file: string) => `https://res.cloudinary.com/demo/image/upload/v1/zobbra/${file}`;

describe('order photo and video details (optional text)', () => {
  it('keeps keyword, review and description on order photos and a title on videos', () => {
    const data = normalizeProductConfig({
      orderImages: [{ url: url('a.jpg'), rating: 4.5, keyword: " Kalka's ", review: 'Great fit', description: 'Delivered in Pune' }],
      videos: [{ url: url('v.mp4'), rating: 5, title: ' Unboxing ' }],
    });
    expect(data.orderImages).toEqual([
      { url: url('a.jpg'), rating: 4.5, keyword: "Kalka's", review: 'Great fit', description: 'Delivered in Pune' },
    ]);
    expect(data.videos).toEqual([{ url: url('v.mp4'), rating: 5, title: 'Unboxing' }]);
  });

  it('stores nothing for blank details, and still accepts plain URLs and ratings only', () => {
    const data = normalizeProductConfig({
      orderImages: [{ url: url('b.jpg'), rating: 3, keyword: '   ', review: '', description: undefined }, url('c.jpg')],
      videos: [{ url: url('w.mp4'), rating: null, title: '' }],
    });
    expect(data.orderImages).toEqual([
      { url: url('b.jpg'), rating: 3 },
      { url: url('c.jpg'), rating: null },
    ]);
    expect(data.videos).toEqual([{ url: url('w.mp4'), rating: null }]);
  });

  it('trims over-long text to the field limits and ignores text fields that do not belong', () => {
    const data = normalizeProductConfig({
      orderImages: [{ url: url('d.jpg'), rating: 5, keyword: 'k'.repeat(100), review: 'r'.repeat(500), description: 'd'.repeat(300), title: 'not for photos' }],
      videos: [{ url: url('x.mp4'), rating: 5, title: 't'.repeat(200), keyword: 'not for videos' }],
    });
    const photo = (data.orderImages as any[])[0];
    expect(photo.keyword).toHaveLength(60);
    expect(photo.review).toHaveLength(300);
    expect(photo.description).toHaveLength(200);
    expect(photo).not.toHaveProperty('title');
    const video = (data.videos as any[])[0];
    expect(video.title).toHaveLength(80);
    expect(video).not.toHaveProperty('keyword');
  });
});
