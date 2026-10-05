/**
 * Mask-based product photo recolouring.
 *
 * A side has a base photo (ideally the white / light-grey product) plus optional masks of the same
 * size: white or opaque = recolour, black or transparent = keep. The body mask follows the body
 * colour and the trim mask the collar/rib colour. Each masked pixel keeps the photo's own
 * brightness relative to the fabric's typical tone, so shadows, highlights, folds and texture stay
 * visible in the new colour; nothing is painted as a flat fill.
 *
 * The same function feeds the on-screen canvas background and the exported quote previews, so the
 * preview matches what the customer saw.
 */

export interface RecolorSource {
  base: string;
  bodyMask: string | null;
  trimMask: string | null;
}

interface MaskData {
  /** 0..1 coverage per pixel. */
  values: Float32Array;
  /** Typical fabric brightness under the mask (shading is measured against it). */
  ref: number;
}

interface Prepared {
  width: number;
  height: number;
  base: Uint8ClampedArray;
  lum: Float32Array;
  body: MaskData | null;
  trim: MaskData | null;
}

/** Larger photos are processed at this size; the stage shows them at about 1000px (2x). */
const MAX_DIMENSION = 1400;

const prepared = new Map<string, Promise<Prepared>>();

import { getColorHex } from './colors';

/** Loads a remote image so its pixels can be read (CORS), bypassing any non-CORS cached copy. */
export function loadCorsImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load image: ${src}`));
      img.src = src;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: retry without query param if that failed
      const retry = new Image();
      retry.crossOrigin = 'anonymous';
      retry.onload = () => resolve(retry);
      retry.onerror = () => reject(new Error(`Could not load image: ${src}`));
      retry.src = src;
    };
    // The on-screen <img> loads without CORS; a distinct URL keeps the browser from reusing that
    // cached non-CORS response, which would taint the canvas.
    img.src = `${src}${src.includes('?') ? '&' : '?'}zcors=1`;
  });
}

export function parseHex(hex: string | null | undefined): [number, number, number] | null {
  const m = (hex || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function pixels(img: CanvasImageSource, width: number, height: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data; // throws SecurityError if tainted
}

/**
 * Mask coverage. A mask with real transparency is read by its alpha (any fill colour works);
 * a fully opaque mask is read by its brightness (white = recolour, black = keep).
 */
function maskValues(data: Uint8ClampedArray, count: number): Float32Array {
  let transparent = 0;
  for (let i = 0; i < count; i++) if (data[i * 4 + 3] < 250) transparent++;
  const useAlpha = transparent > count * 0.01;
  const values = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    values[i] = useAlpha ? data[o + 3] / 255 : luminance(data[o], data[o + 1], data[o + 2]) / 255;
  }
  return values;
}

/** The fabric's typical tone: a high percentile of brightness under the mask (ignores deep shadows). */
function referenceTone(lum: Float32Array, values: Float32Array): number {
  const bins = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < lum.length; i++) {
    if (values[i] < 0.5) continue;
    bins[Math.min(255, Math.round(lum[i] * 255))]++;
    total++;
  }
  if (total === 0) return 1;
  const target = total * 0.8;
  let seen = 0;
  for (let b = 0; b < 256; b++) {
    seen += bins[b];
    if (seen >= target) return Math.max(0.05, b / 255);
  }
  return 1;
}

async function prepare(source: RecolorSource): Promise<Prepared> {
  const [base, body, trim] = await Promise.all([
    loadCorsImage(source.base),
    source.bodyMask ? loadCorsImage(source.bodyMask) : Promise.resolve(null),
    source.trimMask ? loadCorsImage(source.trimMask) : Promise.resolve(null),
  ]);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(base.naturalWidth || 1, base.naturalHeight || 1));
  const width = Math.max(1, Math.round(base.naturalWidth * scale));
  const height = Math.max(1, Math.round(base.naturalHeight * scale));
  const count = width * height;

  const basePixels = pixels(base, width, height);
  const lum = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    lum[i] = luminance(basePixels[o], basePixels[o + 1], basePixels[o + 2]) / 255;
  }
  // Masks are stretched to the photo: they must be exported at the photo's size / aspect ratio.
  const mask = (img: HTMLImageElement | null): MaskData | null => {
    if (!img) return null;
    const values = maskValues(pixels(img, width, height), count);
    return { values, ref: referenceTone(lum, values) };
  };
  return { width, height, base: basePixels, lum, body: mask(body), trim: mask(trim) };
}

function getPrepared(source: RecolorSource): Promise<Prepared> {
  const key = `${source.base}|${source.bodyMask || ''}|${source.trimMask || ''}`;
  let entry = prepared.get(key);
  if (!entry) {
    entry = prepare(source);
    prepared.set(key, entry);
    entry.catch(() => prepared.delete(key)); // allow a retry after a network/CORS failure
  }
  return entry;
}

/**
 * New value (0..1) of one channel for a fabric pixel of brightness `l`, dyed `c`.
 * Light colours use the photo's shading as a multiplier (white base → coloured cloth); dark colours
 * add the shading as an offset so folds and highlights stay visible on navy/black. The two are
 * blended by the colour's own brightness, so mid colours get a mix of both.
 */
export function dye(l: number, ref: number, c: number, weight: number): number {
  const s = l / ref;
  const multiplied = s <= 1 ? c * s : c + (1 - c) * Math.min(1, (s - 1) * 0.6);
  const offset = c + (l - ref) * 0.85;
  const v = weight * multiplied + (1 - weight) * offset;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function applyMask(
  out: Uint8ClampedArray,
  p: Prepared,
  mask: MaskData,
  colour: [number, number, number]
) {
  const weight = Math.min(1, Math.max(0, luminance(colour[0], colour[1], colour[2])));
  const { values, ref } = mask;
  for (let i = 0; i < values.length; i++) {
    const m = values[i];
    if (m <= 0.004) continue;
    const o = i * 4;
    const l = p.lum[i];
    for (let ch = 0; ch < 3; ch++) {
      const dyed = dye(l, ref, colour[ch], weight) * 255;
      out[o + ch] = out[o + ch] * (1 - m) + dyed * m;
    }
  }
}

/**
 * The side's photo recoloured with the body and trim colours (hex; null/invalid = leave as is).
 * Rejects when the photo or a mask cannot be read (e.g. no CORS) so callers can fall back to the
 * plain photo.
 */
export async function renderRecolored(
  source: RecolorSource,
  bodyHex: string | null | undefined,
  trimHex: string | null | undefined
): Promise<HTMLCanvasElement> {
  const p = await getPrepared(source);
  const out = new Uint8ClampedArray(p.base);
  const resolveHex = (val: string | null | undefined) => {
    if (!val) return null;
    const clean = val.trim();
    if (clean.startsWith('#') || /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(clean)) {
      return parseHex(clean);
    }
    return parseHex(getColorHex(clean));
  };
  const body = resolveHex(bodyHex);
  const trim = resolveHex(trimHex);
  if (p.body && body) applyMask(out, p, p.body, body);
  // Trim is applied last, so it wins where the two masks overlap.
  if (p.trim && trim) applyMask(out, p, p.trim, trim);

  const canvas = document.createElement('canvas');
  canvas.width = p.width;
  canvas.height = p.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.putImageData(new ImageData(out, p.width, p.height), 0, 0);
  return canvas;
}
