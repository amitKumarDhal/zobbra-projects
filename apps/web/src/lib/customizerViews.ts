/**
 * Front/back product photos the customizer draws behind the design.
 *
 * The admin picks which uploaded photo is the front and which is the back (or turns the back off),
 * and may mark a print-area guide on each. Products saved before this existed have no
 * `customizerViews` and keep the legacy behaviour: first photo = front, second photo = back.
 */
import { type CustomizerTemplate, type PrintableAreaConfig, getReusableTemplateById } from './customizerTemplates';
import { loadCorsImage, type RecolorSource } from './photoRecolor';

export type CustomizerSide = 'front' | 'back';

/** Print-area guide as fractions (0..1) of the photo box. */
export interface PrintArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Recolouring masks aligned with the side's photo (see lib/photoRecolor). */
export interface ViewMasks {
  bodyMask: string | null;
  trimMask: string | null;
}

export interface CustomizerViews {
  front: { image: string; area: PrintArea | null } & ViewMasks;
  back: { enabled: boolean; image: string | null; area: PrintArea | null } & ViewMasks;
}

/** Fabric canvas size: the padding box of the 540px customizer stage (see CustomizerCanvas). */
export const STAGE_CANVAS_WIDTH = 538;
export const STAGE_CANVAS_HEIGHT = 624;
/** Where the product photo is drawn inside the stage canvas (the stage's content box, 8px padding). */
export const PHOTO_BOX = { left: 8, top: 8, width: 522, height: 608 };

const isArea = (a: any): a is PrintArea =>
  !!a && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(a[k]) && a[k] >= 0 && a[k] <= 1) && a.w > 0 && a.h > 0;

const nonEmpty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** The admin's view configuration, or null for products that never set one. */
export function getCustomizerViews(product: any): CustomizerViews | null {
  const raw = product?.customizerViews;
  const front = nonEmpty(raw?.front?.image);
  if (!front) return null;
  const backImage = nonEmpty(raw?.back?.image);
  const backEnabled = Boolean(raw?.back?.enabled) && !!backImage;
  return {
    front: {
      image: front,
      area: isArea(raw.front.area) ? raw.front.area : null,
      bodyMask: nonEmpty(raw.front.bodyMask),
      trimMask: nonEmpty(raw.front.trimMask),
    },
    back: {
      enabled: backEnabled,
      image: backEnabled ? backImage : null,
      area: backEnabled && isArea(raw.back.area) ? raw.back.area : null,
      bodyMask: backEnabled ? nonEmpty(raw.back.bodyMask) : null,
      trimMask: backEnabled ? nonEmpty(raw.back.trimMask) : null,
    },
  };
}

/**
 * The photo and masks to recolour for one side, or null when the side has no mask (the plain
 * photo is shown). A body-only or trim-only side recolours just that part.
 */
export function getSideRecolor(product: any, side: CustomizerSide): RecolorSource | null {
  // If back is disabled, back recoloring must not initialize
  if (side === 'back' && !isBackSideEnabled(product)) {
    return null;
  }

  // 1. Reusable Template priority (Phase 2 & Phase 4)
  const templateId = product?.customizerTemplateId || product?.customizerTemplate?.id;
  const template = (templateId ? getReusableTemplateById(templateId) : null) || product?.customizerTemplate;
  if (template && template.active !== false) {
    if (side === 'back' && !template.supportsBack) {
      return null;
    }
    const baseLayer = template.layers?.find((l: any) => l.side === side && l.layerType === 'base');
    const bodyLayer = template.layers?.find(
      (l: any) =>
        l.side === side &&
        (l.colorGroup === 'BODY' || l.layerType === 'body' || (l.layerType === 'mask' && l.colorGroup === 'BODY'))
    );
    // Trim recoloring is allowed ONLY if product feature trimColorEnabled !== false AND customizer.trimColor !== false
    const trimAllowed =
      product?.trimColorEnabled !== false &&
      (product?.customizer ? product.customizer.trimColor !== false : true);

    const trimLayer = trimAllowed
      ? template.layers?.find(
          (l: any) =>
            l.side === side &&
            (l.colorGroup === 'TRIM' || l.layerType === 'trim' || (l.layerType === 'mask' && l.colorGroup === 'TRIM'))
        )
      : null;

    const baseAsset = baseLayer?.assetUrl || bodyLayer?.assetUrl;
    if (baseAsset && (bodyLayer || trimLayer)) {
      return {
        base: baseAsset,
        bodyMask: bodyLayer?.assetUrl ?? null,
        trimMask: trimLayer?.assetUrl ?? null,
      };
    }
  }

  // 2. Existing customizerViews fallback
  const views = getCustomizerViews(product);
  const view = views ? views[side] : null;
  if (!view || !view.image || (!view.bodyMask && !view.trimMask)) return null;

  const trimAllowed =
    product?.trimColorEnabled !== false &&
    (product?.customizer ? product.customizer.trimColor !== false : true);

  return { base: view.image, bodyMask: view.bodyMask, trimMask: trimAllowed ? view.trimMask : null };
}

/** Whether any side has a collar/rib mask (the customizer then always offers a trim colour). */
export function hasTrimMask(product: any): boolean {
  if (product?.customizer && typeof product.customizer.trimColor === 'boolean') {
    return product.customizer.trimColor;
  }
  if (product?.trimColorEnabled === false) {
    return false;
  }
  const templateId = product?.customizerTemplateId || product?.customizerTemplate?.id;
  const template = (templateId ? getReusableTemplateById(templateId) : null) || product?.customizerTemplate;
  if (template && template.active !== false) {
    return (
      template.layers?.some(
        (l: any) =>
          l.colorGroup === 'TRIM' ||
          l.layerType === 'trim' ||
          (l.layerType === 'mask' && l.colorGroup === 'TRIM')
      ) || template.colorGroups?.some((g: any) => g.id === 'TRIM') || false
    );
  }
  const views = getCustomizerViews(product);
  return !!views && Boolean(views.front.trimMask || views.back.trimMask);
}

/** Whether customers can design the back. Legacy products always offered it. */
export function isBackSideEnabled(product: any): boolean {
  if (!product) return false;
  if (product.customizer && typeof product.customizer.back === 'boolean') {
    return product.customizer.back;
  }
  if (product.backDesignEnabled === false) {
    return false;
  }
  const templateId = product?.customizerTemplateId || product?.customizerTemplate?.id;
  const template = (templateId ? getReusableTemplateById(templateId) : null) || product?.customizerTemplate;
  if (template && template.active !== false) return Boolean(template.supportsBack) && product.backDesignEnabled !== false;
  const views = getCustomizerViews(product);
  return views ? views.back.enabled && product.backDesignEnabled !== false : product.backDesignEnabled !== false;
}

/** The photo to show behind the design for one side, or null to use the drawn silhouette. */
export function getCustomizerSideImage(product: any, side: CustomizerSide): string | null {
  if (side === 'back' && !isBackSideEnabled(product)) {
    return null;
  }

  // 1. Reusable Template priority (Phase 2 & Phase 4)
  const templateId = product?.customizerTemplateId || product?.customizerTemplate?.id;
  const template = (templateId ? getReusableTemplateById(templateId) : null) || product?.customizerTemplate;
  if (template && template.active !== false) {
    if (side === 'back' && !template.supportsBack) {
      return null;
    }
    const baseLayer = template.layers?.find((l: any) => l.side === side && l.layerType === 'base');
    if (baseLayer) return baseLayer.assetUrl;
    const bodyLayer = template.layers?.find(
      (l: any) =>
        l.side === side &&
        (l.layerType === 'body' || (l.layerType === 'mask' && l.colorGroup === 'BODY') || l.colorGroup === 'BODY')
    );
    if (bodyLayer) return bodyLayer.assetUrl;
  }

  // 2. Existing customizerViews fallback
  const views = getCustomizerViews(product);
  if (views) return side === 'front' ? views.front.image : views.back.image;

  // 3. Legacy: catalog photos in admin order (only if not a template product)
  const images: unknown = product?.images;
  if (!Array.isArray(images)) return null;
  const usable = images.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  if (usable.length === 0) return null;
  return side === 'back' && usable[1] ? usable[1] : usable[0];
}

/** Converts a photo-box fraction area into the stage geometry the canvas and its guide use. */
export function printAreaToConfig(area: PrintArea, base: PrintableAreaConfig): PrintableAreaConfig {
  const x = PHOTO_BOX.left + area.x * PHOTO_BOX.width;
  const y = PHOTO_BOX.top + area.y * PHOTO_BOX.height;
  const width = area.w * PHOTO_BOX.width;
  const height = area.h * PHOTO_BOX.height;
  const pctW = (v: number) => `${(v / STAGE_CANVAS_WIDTH) * 100}%`;
  const pctH = (v: number) => `${(v / STAGE_CANVAS_HEIGHT) * 100}%`;
  return {
    ...base,
    width: Math.round(width),
    height: Math.round(height),
    left: pctW(x),
    top: pctH(y),
    styleWidth: pctW(width),
    styleHeight: pctH(height),
  };
}

/**
 * The category template with this product's own view settings applied: the admin's print-area
 * guides replace the template's, and a disabled back removes the back side.
 * Without a view configuration the template is returned unchanged.
 */
export function applyCustomizerViews(template: CustomizerTemplate, product: any): CustomizerTemplate {
  const views = getCustomizerViews(product);
  const backEnabled = isBackSideEnabled(product);
  const isTrimAllowed =
    product?.trimColorEnabled !== false &&
    (product?.customizer ? product.customizer.trimColor !== false : true);
  const trimEnabled =
    isTrimAllowed &&
    (hasTrimMask(product) ||
      Boolean(
        product?.customizerViews?.secondaryColors?.length ||
        product?.secondaryColors?.length ||
        product?.collarColors?.length
      ));

  if (!views) {
    if (!isTrimAllowed || !backEnabled) {
      return {
        ...template,
        secondaryColorLabel: !isTrimAllowed ? undefined : template.secondaryColorLabel,
        supportsBack: !backEnabled ? false : template.supportsBack,
        backPrintableArea: !backEnabled ? undefined : template.backPrintableArea,
      };
    }
    return template;
  }
  const front = views.front.area
    ? printAreaToConfig(views.front.area, template.frontPrintableArea)
    : template.frontPrintableArea;
  const backBase = template.backPrintableArea || template.frontPrintableArea;
  const back = backEnabled && views.back.enabled
    ? views.back.area
      ? printAreaToConfig(views.back.area, backBase)
      : backBase
    : undefined;

  return {
    ...template,
    // A collar/rib mask needs a trim colour picker even on templates that have none.
    secondaryColorLabel: trimEnabled ? (template.secondaryColorLabel || 'COLLAR & RIB COLOR') : undefined,
    supportsBack: backEnabled && views.back.enabled,
    frontPrintableArea: front,
    backPrintableArea: back,
  };
}

const loadDataImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load design layer'));
    img.src = src;
  });

/**
 * Draws the product photo (fitted like the on-screen backdrop) with the full-stage design layer on
 * top. The photo is a URL, or an already recoloured canvas. Rejects if the photo cannot be loaded
 * CORS-safely, so the caller can fall back.
 */
export async function composeOverPhoto(
  photoSource: string | HTMLCanvasElement,
  designDataUrl: string,
  multiplier = 2
): Promise<string> {
  const [photoImage, design] = await Promise.all([
    typeof photoSource === 'string' ? loadCorsImage(photoSource) : Promise.resolve(photoSource),
    loadDataImage(designDataUrl),
  ]);
  const photo = {
    image: photoImage,
    naturalWidth: photoImage instanceof HTMLCanvasElement ? photoImage.width : photoImage.naturalWidth,
    naturalHeight: photoImage instanceof HTMLCanvasElement ? photoImage.height : photoImage.naturalHeight,
  };
  const canvas = document.createElement('canvas');
  canvas.width = STAGE_CANVAS_WIDTH * multiplier;
  canvas.height = STAGE_CANVAS_HEIGHT * multiplier;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const box = {
    x: PHOTO_BOX.left * multiplier,
    y: PHOTO_BOX.top * multiplier,
    w: PHOTO_BOX.width * multiplier,
    h: PHOTO_BOX.height * multiplier,
  };
  const scale = Math.min(box.w / (photo.naturalWidth || 1), box.h / (photo.naturalHeight || 1));
  const w = photo.naturalWidth * scale;
  const h = photo.naturalHeight * scale;
  ctx.drawImage(photo.image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  ctx.drawImage(design, 0, 0, canvas.width, canvas.height);
  // Throws SecurityError when the photo tainted the canvas; the caller falls back to the design only.
  return canvas.toDataURL('image/jpeg', 0.92);
}
