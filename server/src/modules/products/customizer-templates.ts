/**
 * ZOBBRA Reusable Customizer Template Registry
 *
 * Implements Phase 1 & Phase 2 of the ZOBBRA Customizer Architecture.
 * Reusable templates define generic layers (transparent PNG body, trim/collar/rib masks),
 * normalized print areas (0..1), versioning, and activation state.
 */

import { prisma } from '../../config/index.js';

export type CustomizerSide = 'front' | 'back';
export type CustomizerLayerType = 'body' | 'trim' | 'base' | 'mask' | 'overlay';
export type CustomizerColorGroup = 'BODY' | 'TRIM' | string;

export interface CustomizerLayer {
  id: string;
  templateId: string;
  name: string;
  side: CustomizerSide;
  assetUrl: string;
  layerType: CustomizerLayerType;
  zIndex: number;
  tintable?: boolean;
  colorGroup?: CustomizerColorGroup | null;
  editable?: boolean;
  visible?: boolean;
  enabled?: boolean;
}

export interface CustomizerPrintArea {
  templateId: string;
  side: CustomizerSide;
  x: number;      // Normalized 0..1
  y: number;      // Normalized 0..1
  width: number;  // Normalized 0..1
  height: number; // Normalized 0..1
  top?: string;
  left?: string;
  styleWidth?: string;
  styleHeight?: string;
  label?: string;
  guideText?: string;
  subGuideText?: string;
}

export interface CustomizerColorGroupConfig {
  id: CustomizerColorGroup;
  label: string;
  defaultColor?: string;
}

export interface CustomizerTemplateCapabilities {
  supportsTrimColor: boolean;
  supportsTapingColor: boolean;
  supportsBack: boolean;
  supportsEmbroidery: boolean;
  supportsZipper: boolean;
}

export interface ReusableCustomizerTemplate {
  id: string;
  name: string;
  description: string;
  categoryCompatibility: string[];
  version: string;
  active: boolean;
  supportsBack: boolean;
  capabilities?: Partial<CustomizerTemplateCapabilities>;
  colorGroups: CustomizerColorGroupConfig[];
  layers: CustomizerLayer[];
  printAreas: CustomizerPrintArea[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Returns capability flags indicating what customization features a template CAN support.
 */
export function getTemplateCapabilities(
  template?: ReusableCustomizerTemplate | null,
  product?: any
): CustomizerTemplateCapabilities {
  if (!template || template.active === false) {
    // Preserve existing fallback behavior for legacy products without a template
    const hasBackFromViews = product?.customizerViews?.back ? product.customizerViews.back.enabled !== false : true;
    return {
      supportsTrimColor: true,
      supportsTapingColor: false,
      supportsBack: hasBackFromViews,
      supportsEmbroidery: true,
      supportsZipper: false,
    };
  }

  const explicit = template.capabilities || {};
  const hasTrimLayer = template.layers.some(
    (l) => l.layerType === 'trim' || (l.layerType === 'mask' && l.colorGroup === 'TRIM')
  );
  const hasTrimGroup = template.colorGroups.some((g) => g.id === 'TRIM');
  const defaultSupportsTrim = hasTrimLayer || hasTrimGroup;

  const id = template.id.toLowerCase();
  const isMug = id.startsWith('mug');
  const isCap = id.startsWith('cap');
  const isBag = id.startsWith('bag');
  const isApparel = template.categoryCompatibility.some((c) =>
    ['t-shirts', 'polos', 'apparel', 'hoodies'].includes(c.toLowerCase())
  );

  return {
    supportsTrimColor: explicit.supportsTrimColor ?? defaultSupportsTrim,
    supportsTapingColor: explicit.supportsTapingColor ?? (isApparel && !isCap && !isBag && !isMug),
    supportsBack: explicit.supportsBack ?? Boolean(template.supportsBack),
    supportsEmbroidery: explicit.supportsEmbroidery ?? !isMug,
    supportsZipper: explicit.supportsZipper ?? (isBag || id.startsWith('hoodie')),
  };
}

/**
 * Validates normalized print area coordinates (0..1).
 * Rejects out-of-bound, negative, or overflow coordinates.
 */
export function validatePrintArea(area: Partial<CustomizerPrintArea> | null | undefined): { valid: boolean; error?: string } {
  if (!area) return { valid: false, error: 'Print area definition is required.' };
  if (area.side !== 'front' && area.side !== 'back') {
    return { valid: false, error: 'Print area side must be "front" or "back".' };
  }
  const { x, y, width, height } = area;
  if (typeof x !== 'number' || isNaN(x) || x < 0 || x > 1) {
    return { valid: false, error: 'Print area x coordinate must be a normalized number between 0 and 1.' };
  }
  if (typeof y !== 'number' || isNaN(y) || y < 0 || y > 1) {
    return { valid: false, error: 'Print area y coordinate must be a normalized number between 0 and 1.' };
  }
  if (typeof width !== 'number' || isNaN(width) || width <= 0 || width > 1) {
    return { valid: false, error: 'Print area width must be a normalized number between 0 and 1 (greater than 0).' };
  }
  if (typeof height !== 'number' || isNaN(height) || height <= 0 || height > 1) {
    return { valid: false, error: 'Print area height must be a normalized number between 0 and 1 (greater than 0).' };
  }
  if (x + width > 1.0001) {
    return { valid: false, error: `Print area exceeds horizontal boundary (x + width = ${(x + width).toFixed(3)} > 1.0).` };
  }
  if (y + height > 1.0001) {
    return { valid: false, error: `Print area exceeds vertical boundary (y + height = ${(y + height).toFixed(3)} > 1.0).` };
  }
  return { valid: true };
}

/**
 * Validates that uploaded asset URLs belong to allowed Cloudinary storage.
 * Disallows insecure protocols, base64 data URLs, and unauthorized domains.
 */
export function validateAssetUrl(url?: string | null): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { valid: true };
  }
  const trimmed = url.trim();

  if (trimmed.startsWith('data:')) {
    return { valid: false, error: 'Base64 data URLs are not permitted. Mockup assets must be uploaded to Cloudinary.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Asset URL must use HTTPS protocol.' };
    }
    const isCloudinary = parsed.hostname.endsWith('cloudinary.com');
    if (!isCloudinary) {
      return { valid: false, error: 'Asset URL must belong to the configured Cloudinary storage.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format for template asset.' };
  }
}

/**
 * Helper accessors for Front and Back Body and Trim mockup layers.
 */
export function getFrontBodyAsset(template: ReusableCustomizerTemplate): CustomizerLayer | undefined {
  return template.layers.find((l) => l.side === 'front' && (l.layerType === 'body' || (l.layerType === 'mask' && l.colorGroup === 'BODY')));
}

export function getFrontTrimAsset(template: ReusableCustomizerTemplate): CustomizerLayer | undefined {
  return template.layers.find((l) => l.side === 'front' && (l.layerType === 'trim' || (l.layerType === 'mask' && l.colorGroup === 'TRIM')));
}

export function getBackBodyAsset(template: ReusableCustomizerTemplate): CustomizerLayer | undefined {
  return template.layers.find((l) => l.side === 'back' && (l.layerType === 'body' || (l.layerType === 'mask' && l.colorGroup === 'BODY')));
}

export function getBackTrimAsset(template: ReusableCustomizerTemplate): CustomizerLayer | undefined {
  return template.layers.find((l) => l.side === 'back' && (l.layerType === 'trim' || (l.layerType === 'mask' && l.colorGroup === 'TRIM')));
}

export function getFrontPrintArea(template: ReusableCustomizerTemplate): CustomizerPrintArea | undefined {
  return template.printAreas.find((p) => p.side === 'front');
}

export function getBackPrintArea(template: ReusableCustomizerTemplate): CustomizerPrintArea | undefined {
  return template.printAreas.find((p) => p.side === 'back');
}

/**
 * Reconstructs standard 4-layer structure from flat URL configuration.
 */
export function normalizeLayersFromFlatAssets(
  templateId: string,
  flat: {
    frontBodyUrl?: string;
    frontTrimUrl?: string;
    backBodyUrl?: string;
    backTrimUrl?: string;
    supportsBack?: boolean;
  }
): CustomizerLayer[] {
  const layers: CustomizerLayer[] = [];

  if (flat.frontBodyUrl) {
    layers.push({
      id: `${templateId}-front-body`,
      templateId,
      name: 'Front Body',
      side: 'front',
      layerType: 'body',
      assetUrl: flat.frontBodyUrl,
      zIndex: 1,
      tintable: true,
      colorGroup: 'BODY',
      editable: false,
      visible: true,
      enabled: true,
    });
  }

  if (flat.frontTrimUrl) {
    layers.push({
      id: `${templateId}-front-trim`,
      templateId,
      name: 'Front Collar / Trim',
      side: 'front',
      layerType: 'trim',
      assetUrl: flat.frontTrimUrl,
      zIndex: 2,
      tintable: true,
      colorGroup: 'TRIM',
      editable: false,
      visible: true,
      enabled: true,
    });
  }

  if (flat.supportsBack !== false) {
    if (flat.backBodyUrl) {
      layers.push({
        id: `${templateId}-back-body`,
        templateId,
        name: 'Back Body',
        side: 'back',
        layerType: 'body',
        assetUrl: flat.backBodyUrl,
        zIndex: 1,
        tintable: true,
        colorGroup: 'BODY',
        editable: false,
        visible: true,
        enabled: true,
      });
    }

    if (flat.backTrimUrl) {
      layers.push({
        id: `${templateId}-back-trim`,
        templateId,
        name: 'Back Collar / Trim',
        side: 'back',
        layerType: 'trim',
        assetUrl: flat.backTrimUrl,
        zIndex: 2,
        tintable: true,
        colorGroup: 'TRIM',
        editable: false,
        visible: true,
        enabled: true,
      });
    }
  }

  return layers;
}

export const REUSABLE_TEMPLATES: Record<string, ReusableCustomizerTemplate> = {
  'polo-v1': {
    id: 'polo-v1',
    name: 'Polo T-Shirt',
    description: 'Standard polo shirt with independent body and collar/rib recoloring layers',
    categoryCompatibility: ['t-shirts', 'polos', 'apparel'],
    version: '1.0',
    active: true,
    supportsBack: true,
    colorGroups: [
      { id: 'BODY', label: 'BODY COLOR', defaultColor: 'White' },
      { id: 'TRIM', label: 'COLLAR & RIB COLOR', defaultColor: 'White' },
    ],
    layers: [
      {
        id: 'polo-v1-front-base',
        templateId: 'polo-v1',
        name: 'Front Base',
        side: 'front',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200001/zobbra/products/dev-polo-front-base.png',
        layerType: 'base',
        zIndex: 0,
        tintable: false,
        colorGroup: null,
        editable: false,
        visible: true,
        enabled: true,
      },
      {
        id: 'polo-v1-front-body',
        templateId: 'polo-v1',
        name: 'Front Body',
        side: 'front',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200002/zobbra/products/dev-polo-front-body-mask.png',
        layerType: 'body',
        zIndex: 1,
        tintable: true,
        colorGroup: 'BODY',
        editable: false,
        visible: true,
        enabled: true,
      },
      {
        id: 'polo-v1-front-trim',
        templateId: 'polo-v1',
        name: 'Front Collar / Rib',
        side: 'front',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200003/zobbra/products/dev-polo-front-trim-mask.png',
        layerType: 'trim',
        zIndex: 2,
        tintable: true,
        colorGroup: 'TRIM',
        editable: false,
        visible: true,
        enabled: true,
      },
      {
        id: 'polo-v1-back-base',
        templateId: 'polo-v1',
        name: 'Back Base',
        side: 'back',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200004/zobbra/products/dev-polo-back-base.png',
        layerType: 'base',
        zIndex: 0,
        tintable: false,
        colorGroup: null,
        editable: false,
        visible: true,
        enabled: true,
      },
      {
        id: 'polo-v1-back-body',
        templateId: 'polo-v1',
        name: 'Back Body',
        side: 'back',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200005/zobbra/products/dev-polo-back-body-mask.png',
        layerType: 'body',
        zIndex: 1,
        tintable: true,
        colorGroup: 'BODY',
        editable: false,
        visible: true,
        enabled: true,
      },
      {
        id: 'polo-v1-back-trim',
        templateId: 'polo-v1',
        name: 'Back Collar / Rib',
        side: 'back',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200006/zobbra/products/dev-polo-back-trim-mask.png',
        layerType: 'trim',
        zIndex: 2,
        tintable: true,
        colorGroup: 'TRIM',
        editable: false,
        visible: true,
        enabled: true,
      },
    ],
    printAreas: [
      {
        templateId: 'polo-v1',
        side: 'front',
        x: 0.29,
        y: 0.224,
        width: 0.42,
        height: 0.52,
        top: '22.4%',
        left: '29%',
        styleWidth: '42%',
        styleHeight: '52%',
        label: 'Print Area: 30cm × 40cm',
        guideText: 'Add your logo, text or artwork',
      },
      {
        templateId: 'polo-v1',
        side: 'back',
        x: 0.29,
        y: 0.224,
        width: 0.42,
        height: 0.52,
        top: '22.4%',
        left: '29%',
        styleWidth: '42%',
        styleHeight: '52%',
        label: 'Back Print Area: 30cm × 40cm',
        guideText: 'Add your back print artwork',
      },
    ],
  },

  'tshirt-v1': {
    id: 'tshirt-v1',
    name: 'Crewneck T-Shirt',
    description: 'Classic crewneck t-shirt with front chest and back printable areas',
    categoryCompatibility: ['t-shirts', 'apparel'],
    version: '1.0',
    active: true,
    supportsBack: true,
    colorGroups: [
      { id: 'BODY', label: 'BODY COLOR', defaultColor: 'White' },
      { id: 'TRIM', label: 'NECK / RIB COLOR', defaultColor: 'White' },
    ],
    layers: [],
    printAreas: [
      {
        templateId: 'tshirt-v1',
        side: 'front',
        x: 0.29,
        y: 0.224,
        width: 0.42,
        height: 0.52,
        top: '22.4%',
        left: '29%',
        styleWidth: '42%',
        styleHeight: '52%',
        label: 'Print Area: 30cm × 40cm',
        guideText: 'Add your logo, text or artwork',
      },
      {
        templateId: 'tshirt-v1',
        side: 'back',
        x: 0.29,
        y: 0.224,
        width: 0.42,
        height: 0.52,
        top: '22.4%',
        left: '29%',
        styleWidth: '42%',
        styleHeight: '52%',
        label: 'Back Print Area: 30cm × 40cm',
        guideText: 'Add your back print artwork',
      },
    ],
  },

  'cap-v1': {
    id: 'cap-v1',
    name: 'Cap / Headwear',
    description: 'Structured 6-panel snapback cap with crown and visor color groups',
    categoryCompatibility: ['caps', 'headwear'],
    version: '1.0',
    active: true,
    supportsBack: true,
    colorGroups: [
      { id: 'BODY', label: 'CROWN COLOR', defaultColor: 'Charcoal Black' },
      { id: 'TRIM', label: 'VISOR / BRIM COLOR', defaultColor: 'Charcoal Black' },
    ],
    layers: [],
    printAreas: [
      {
        templateId: 'cap-v1',
        side: 'front',
        x: 0.34,
        y: 0.328,
        width: 0.32,
        height: 0.198,
        top: '32.8%',
        left: '34%',
        styleWidth: '32%',
        styleHeight: '19.8%',
        label: 'Embroidery Area: 10cm × 5.5cm (Front Crown)',
        guideText: 'Add your logo or text',
      },
      {
        templateId: 'cap-v1',
        side: 'back',
        x: 0.35,
        y: 0.380,
        width: 0.30,
        height: 0.110,
        top: '38%',
        left: '35%',
        styleWidth: '30%',
        styleHeight: '11%',
        label: 'Back Arch Embroidery',
        guideText: 'Add rear text or logo',
      },
    ],
  },

  'bag-v1': {
    id: 'bag-v1',
    name: 'Bags & Backpacks',
    description: 'Corporate bag with body and handle accent color groups',
    categoryCompatibility: ['bags', 'backpacks'],
    version: '1.0',
    active: true,
    supportsBack: true,
    colorGroups: [
      { id: 'BODY', label: 'BAG COLOR', defaultColor: 'Charcoal Black' },
      { id: 'TRIM', label: 'HANDLE & ACCENTS', defaultColor: 'Charcoal Black' },
    ],
    layers: [],
    printAreas: [
      {
        templateId: 'bag-v1',
        side: 'front',
        x: 0.31,
        y: 0.350,
        width: 0.38,
        height: 0.300,
        top: '35%',
        left: '31%',
        styleWidth: '38%',
        styleHeight: '30%',
        label: 'Branding Area: 12cm × 10cm (Front Panel)',
        guideText: 'Add your corporate logo or artwork',
      },
      {
        templateId: 'bag-v1',
        side: 'back',
        x: 0.32,
        y: 0.360,
        width: 0.36,
        height: 0.260,
        top: '36%',
        left: '32%',
        styleWidth: '36%',
        styleHeight: '26%',
        label: 'Branding Area: Upper Back / Strap',
        guideText: 'Add rear branding or label',
      },
    ],
  },

  'mug-v1': {
    id: 'mug-v1',
    name: 'Ceramic Mug',
    description: 'Classic 11oz ceramic mug with front and reverse print areas',
    categoryCompatibility: ['drinkware', 'mugs'],
    version: '1.0',
    active: true,
    supportsBack: true,
    colorGroups: [
      { id: 'BODY', label: 'MUG COLOR', defaultColor: 'White' },
      { id: 'TRIM', label: 'HANDLE & INNER COLOR', defaultColor: 'White' },
    ],
    layers: [],
    printAreas: [
      {
        templateId: 'mug-v1',
        side: 'front',
        x: 0.25,
        y: 0.270,
        width: 0.40,
        height: 0.460,
        top: '27%',
        left: '25%',
        styleWidth: '40%',
        styleHeight: '46%',
        label: 'Print Area: 8.5cm × 7.5cm (Front View)',
        guideText: 'Add your logo or design',
      },
      {
        templateId: 'mug-v1',
        side: 'back',
        x: 0.35,
        y: 0.270,
        width: 0.40,
        height: 0.460,
        top: '27%',
        left: '35%',
        styleWidth: '40%',
        styleHeight: '46%',
        label: 'Print Area: 8.5cm × 7.5cm (Reverse View)',
        guideText: 'Add reverse side artwork',
      },
    ],
  },
};

export function getCustomizerTemplateById(id?: string | null): ReusableCustomizerTemplate | null {
  if (!id) return null;
  return REUSABLE_TEMPLATES[id.trim()] || null;
}

export async function getCustomizerTemplateByIdAsync(id?: string | null): Promise<ReusableCustomizerTemplate | null> {
  if (!id) return null;
  const trimmed = id.trim();
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "customizer_templates" WHERE "id" = $1 LIMIT 1`,
      trimmed
    );
    if (rows && rows.length > 0) {
      const row = rows[0];
      const template: ReusableCustomizerTemplate = {
        id: row.id,
        name: row.name,
        description: row.description || '',
        version: row.version || '1.0',
        active: Boolean(row.active),
        supportsBack: Boolean(row.supportsBack),
        categoryCompatibility: Array.isArray(row.categoryCompatibility) ? row.categoryCompatibility : [],
        colorGroups: typeof row.colorGroups === 'string' ? JSON.parse(row.colorGroups) : (row.colorGroups || []),
        layers: typeof row.layers === 'string' ? JSON.parse(row.layers) : (row.layers || []),
        printAreas: typeof row.printAreas === 'string' ? JSON.parse(row.printAreas) : (row.printAreas || []),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      REUSABLE_TEMPLATES[template.id] = template;
      return template;
    }
  } catch {
    // Fall back to in-memory store
  }
  return REUSABLE_TEMPLATES[trimmed] || null;
}

export function isValidCustomizerTemplate(id?: string | null): boolean {
  if (!id) return false;
  return Boolean(REUSABLE_TEMPLATES[id.trim()]?.active);
}

export function listCustomizerTemplates(options?: { includeInactive?: boolean }): ReusableCustomizerTemplate[] {
  const all = Object.values(REUSABLE_TEMPLATES);
  if (options?.includeInactive) return all;
  return all.filter((t) => t.active);
}

export async function listCustomizerTemplatesAsync(options?: { includeInactive?: boolean }): Promise<ReusableCustomizerTemplate[]> {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "customizer_templates"`);
    if (rows && rows.length > 0) {
      for (const row of rows) {
        REUSABLE_TEMPLATES[row.id] = {
          id: row.id,
          name: row.name,
          description: row.description || '',
          version: row.version || '1.0',
          active: Boolean(row.active),
          supportsBack: Boolean(row.supportsBack),
          categoryCompatibility: Array.isArray(row.categoryCompatibility) ? row.categoryCompatibility : [],
          colorGroups: typeof row.colorGroups === 'string' ? JSON.parse(row.colorGroups) : (row.colorGroups || []),
          layers: typeof row.layers === 'string' ? JSON.parse(row.layers) : (row.layers || []),
          printAreas: typeof row.printAreas === 'string' ? JSON.parse(row.printAreas) : (row.printAreas || []),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }
    }
  } catch {
    // Use in-memory store
  }
  return listCustomizerTemplates(options);
}

/**
 * Creates a new template with validation.
 */
export async function createCustomizerTemplate(
  data: Partial<ReusableCustomizerTemplate> & { id: string; name: string }
): Promise<ReusableCustomizerTemplate> {
  const id = data.id.trim();
  if (!id) throw new Error('Template ID is required.');
  if (REUSABLE_TEMPLATES[id]) {
    throw new Error(`Template with ID '${id}' already exists.`);
  }

  // Validate print areas
  if (Array.isArray(data.printAreas)) {
    for (const pa of data.printAreas) {
      const check = validatePrintArea(pa);
      if (!check.valid) throw new Error(check.error);
    }
  }

  // Validate layer asset URLs
  if (Array.isArray(data.layers)) {
    for (const layer of data.layers) {
      const check = validateAssetUrl(layer.assetUrl);
      if (!check.valid) throw new Error(check.error);
    }
  }

  const template: ReusableCustomizerTemplate = {
    id,
    name: data.name.trim(),
    description: data.description || '',
    categoryCompatibility: data.categoryCompatibility || ['apparel'],
    version: data.version?.trim() || '1.0',
    active: data.active !== false,
    supportsBack: data.supportsBack !== false,
    capabilities: data.capabilities,
    colorGroups: data.colorGroups || [
      { id: 'BODY', label: 'BODY COLOR', defaultColor: 'White' },
      { id: 'TRIM', label: 'COLLAR & RIB COLOR', defaultColor: 'White' },
    ],
    layers: data.layers || [],
    printAreas: data.printAreas || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Cache in-memory
  REUSABLE_TEMPLATES[id] = template;

  // Persist to Postgres if available
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "customizer_templates" ("id", "name", "description", "version", "active", "supportsBack", "categoryCompatibility", "colorGroups", "layers", "printAreas", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, NOW(), NOW())
       ON CONFLICT ("id") DO UPDATE SET
         "name" = EXCLUDED."name",
         "description" = EXCLUDED."description",
         "version" = EXCLUDED."version",
         "active" = EXCLUDED."active",
         "supportsBack" = EXCLUDED."supportsBack",
         "categoryCompatibility" = EXCLUDED."categoryCompatibility",
         "colorGroups" = EXCLUDED."colorGroups",
         "layers" = EXCLUDED."layers",
         "printAreas" = EXCLUDED."printAreas",
         "updatedAt" = NOW()`,
      template.id,
      template.name,
      template.description,
      template.version,
      template.active,
      template.supportsBack,
      template.categoryCompatibility,
      JSON.stringify(template.colorGroups),
      JSON.stringify(template.layers),
      JSON.stringify(template.printAreas)
    );
  } catch (err: any) {
    console.warn('[CustomizerTemplates] Warning writing to database:', err?.message || err);
  }

  return template;
}

/**
 * Updates an existing template with validation.
 */
export async function updateCustomizerTemplate(
  id: string,
  data: Partial<ReusableCustomizerTemplate> & {
    frontBodyUrl?: string;
    frontTrimUrl?: string;
    backBodyUrl?: string;
    backTrimUrl?: string;
  }
): Promise<ReusableCustomizerTemplate> {
  const existing = REUSABLE_TEMPLATES[id.trim()];
  if (!existing) {
    throw new Error(`Template with ID '${id}' not found.`);
  }

  // Validate print areas if provided
  if (Array.isArray(data.printAreas)) {
    for (const pa of data.printAreas) {
      const check = validatePrintArea(pa);
      if (!check.valid) throw new Error(check.error);
    }
  }

  // Validate layer asset URLs if provided
  if (Array.isArray(data.layers)) {
    for (const layer of data.layers) {
      const check = validateAssetUrl(layer.assetUrl);
      if (!check.valid) throw new Error(check.error);
    }
  }

  // If flat URLs are provided, validate them
  if (data.frontBodyUrl !== undefined) {
    const check = validateAssetUrl(data.frontBodyUrl);
    if (!check.valid) throw new Error(check.error);
  }
  if (data.frontTrimUrl !== undefined) {
    const check = validateAssetUrl(data.frontTrimUrl);
    if (!check.valid) throw new Error(check.error);
  }
  if (data.backBodyUrl !== undefined) {
    const check = validateAssetUrl(data.backBodyUrl);
    if (!check.valid) throw new Error(check.error);
  }
  if (data.backTrimUrl !== undefined) {
    const check = validateAssetUrl(data.backTrimUrl);
    if (!check.valid) throw new Error(check.error);
  }

  let mergedLayers = data.layers ?? existing.layers;
  if (
    data.frontBodyUrl !== undefined ||
    data.frontTrimUrl !== undefined ||
    data.backBodyUrl !== undefined ||
    data.backTrimUrl !== undefined
  ) {
    const flatLayers = normalizeLayersFromFlatAssets(existing.id, {
      frontBodyUrl: data.frontBodyUrl ?? getFrontBodyAsset(existing)?.assetUrl,
      frontTrimUrl: data.frontTrimUrl ?? getFrontTrimAsset(existing)?.assetUrl,
      backBodyUrl: data.backBodyUrl ?? getBackBodyAsset(existing)?.assetUrl,
      backTrimUrl: data.backTrimUrl ?? getBackTrimAsset(existing)?.assetUrl,
      supportsBack: data.supportsBack ?? existing.supportsBack,
    });
    // Merge base layers (zIndex 0) if any existed
    const baseLayers = existing.layers.filter((l) => l.layerType === 'base');
    mergedLayers = [...baseLayers, ...flatLayers];
  }

  const updated: ReusableCustomizerTemplate = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    version: data.version !== undefined ? data.version.trim() : existing.version,
    active: data.active !== undefined ? Boolean(data.active) : existing.active,
    supportsBack: data.supportsBack !== undefined ? Boolean(data.supportsBack) : existing.supportsBack,
    categoryCompatibility: data.categoryCompatibility ?? existing.categoryCompatibility,
    colorGroups: data.colorGroups ?? existing.colorGroups,
    layers: mergedLayers,
    printAreas: data.printAreas ?? existing.printAreas,
    updatedAt: new Date(),
  };

  REUSABLE_TEMPLATES[id.trim()] = updated;

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "customizer_templates" SET
         "name" = $2,
         "description" = $3,
         "version" = $4,
         "active" = $5,
         "supportsBack" = $6,
         "categoryCompatibility" = $7,
         "colorGroups" = $8::jsonb,
         "layers" = $9::jsonb,
         "printAreas" = $10::jsonb,
         "updatedAt" = NOW()
       WHERE "id" = $1`,
      updated.id,
      updated.name,
      updated.description,
      updated.version,
      updated.active,
      updated.supportsBack,
      updated.categoryCompatibility,
      JSON.stringify(updated.colorGroups),
      JSON.stringify(updated.layers),
      JSON.stringify(updated.printAreas)
    );
  } catch (err: any) {
    console.warn('[CustomizerTemplates] Warning updating database:', err?.message || err);
  }

  return updated;
}

/**
 * Toggles a template's activation status.
 */
export async function setCustomizerTemplateActive(id: string, active: boolean): Promise<ReusableCustomizerTemplate> {
  return updateCustomizerTemplate(id, { active });
}
