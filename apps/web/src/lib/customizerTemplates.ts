/**
 * ZOBBRA Product Customizer Template Resolver
 * Centralized registry mapping products and categories to their visual mockups,
 * printable areas, Front/Back capabilities, and styling configurations.
 */

export type ProductTemplateType = 'tshirt' | 'cap' | 'mug' | 'bag' | 'hoodie' | 'generic';

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
      },
      {
        id: 'polo-v1-front-body',
        templateId: 'polo-v1',
        name: 'Front Body',
        side: 'front',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200002/zobbra/products/dev-polo-front-body-mask.png',
        layerType: 'mask',
        zIndex: 1,
        tintable: true,
        colorGroup: 'BODY',
        editable: false,
        visible: true,
      },
      {
        id: 'polo-v1-front-trim',
        templateId: 'polo-v1',
        name: 'Front Collar / Rib',
        side: 'front',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200003/zobbra/products/dev-polo-front-trim-mask.png',
        layerType: 'mask',
        zIndex: 2,
        tintable: true,
        colorGroup: 'TRIM',
        editable: false,
        visible: true,
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
      },
      {
        id: 'polo-v1-back-body',
        templateId: 'polo-v1',
        name: 'Back Body',
        side: 'back',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200005/zobbra/products/dev-polo-back-body-mask.png',
        layerType: 'mask',
        zIndex: 1,
        tintable: true,
        colorGroup: 'BODY',
        editable: false,
        visible: true,
      },
      {
        id: 'polo-v1-back-trim',
        templateId: 'polo-v1',
        name: 'Back Collar / Rib',
        side: 'back',
        assetUrl: 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200006/zobbra/products/dev-polo-back-trim-mask.png',
        layerType: 'mask',
        zIndex: 2,
        tintable: true,
        colorGroup: 'TRIM',
        editable: false,
        visible: true,
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

export function getReusableTemplateById(id?: string | null): ReusableCustomizerTemplate | null {
  if (!id) return null;
  return REUSABLE_TEMPLATES[id.trim()] || null;
}

export function isValidCustomizerTemplate(id?: string | null): boolean {
  if (!id) return false;
  return Boolean(REUSABLE_TEMPLATES[id.trim()]?.active);
}

export function listReusableTemplates(): ReusableCustomizerTemplate[] {
  return Object.values(REUSABLE_TEMPLATES).filter((t) => t.active);
}

export interface PrintableAreaConfig {
  width: number;
  height: number;
  top: string;
  left: string;
  styleWidth: string;
  styleHeight: string;
  label: string;
  guideText: string;
  subGuideText?: string;
}

export interface CustomizerTemplate {
  type: ProductTemplateType;
  name: string;
  label?: string;
  categorySlug: string;
  supportsBack: boolean;
  requiresSize?: boolean;
  colorLabel: string;
  secondaryColorLabel?: string;
  addTextButtonLabel: string;
  defaultColor: string;
  defaultSecondaryColor?: string;
  frontPrintableArea: PrintableAreaConfig;
  backPrintableArea?: PrintableAreaConfig;
}

export const TEMPLATES: Record<ProductTemplateType, CustomizerTemplate> = {
  tshirt: {
    type: 'tshirt',
    name: 'Custom Apparel',
    label: 'Custom Apparel',
    categorySlug: 't-shirts',
    supportsBack: true,
    requiresSize: true,
    colorLabel: 'BODY COLOR',
    secondaryColorLabel: 'COLLAR & RIB COLOR',
    addTextButtonLabel: '+ Add Text to Garment',
    defaultColor: 'White',
    defaultSecondaryColor: 'Yellow',
    frontPrintableArea: {
      width: 210,
      height: 300,
      top: '22.4%',
      left: '29%',
      styleWidth: '42%',
      styleHeight: '52%',
      label: 'Print Area: 30cm × 40cm',
      guideText: 'Add your logo, text or artwork',
      subGuideText: 'Select an option from the design tools to begin',
    },
    backPrintableArea: {
      width: 210,
      height: 300,
      top: '22.4%',
      left: '29%',
      styleWidth: '42%',
      styleHeight: '52%',
      label: 'Back Print Area: 30cm × 40cm',
      guideText: 'Add your back print artwork',
      subGuideText: 'Choose a design tool to begin',
    },
  },

  cap: {
    type: 'cap',
    name: 'Custom Headwear',
    label: 'Custom Headwear',
    categorySlug: 'caps',
    supportsBack: true,
    requiresSize: false,
    colorLabel: 'CROWN COLOR',
    secondaryColorLabel: 'VISOR / BRIM COLOR',
    addTextButtonLabel: '+ Add Text to Cap',
    defaultColor: 'Charcoal Black',
    defaultSecondaryColor: 'Charcoal Black',
    frontPrintableArea: {
      width: 200,
      height: 115,
      top: '32.8%',
      left: '34%',
      styleWidth: '32%',
      styleHeight: '19.8%',
      label: 'Embroidery Area: 10cm × 5.5cm (Front Crown)',
      guideText: 'Add your logo or text',
      subGuideText: 'Choose a design tool to begin',
    },
    backPrintableArea: {
      width: 180,
      height: 60,
      top: '38%',
      left: '35%',
      styleWidth: '30%',
      styleHeight: '11%',
      label: 'Back Arch Embroidery',
      guideText: 'Add rear text or logo',
      subGuideText: 'Choose a design tool to begin',
    },
  },

  mug: {
    type: 'mug',
    name: 'Custom Drinkware',
    label: 'Custom Ceramic Mug',
    categorySlug: 'drinkware',
    supportsBack: true,
    requiresSize: false,
    colorLabel: 'MUG COLOR',
    secondaryColorLabel: 'HANDLE & INNER COLOR',
    addTextButtonLabel: '+ Add Text to Mug',
    defaultColor: 'White',
    defaultSecondaryColor: 'White',
    frontPrintableArea: {
      width: 190,
      height: 190,
      top: '27%',
      left: '25%',
      styleWidth: '40%',
      styleHeight: '46%',
      label: 'Print Area: 8.5cm × 7.5cm (Front View)',
      guideText: 'Add your logo or design',
      subGuideText: 'Choose a design tool to begin',
    },
    backPrintableArea: {
      width: 190,
      height: 190,
      top: '27%',
      left: '35%',
      styleWidth: '40%',
      styleHeight: '46%',
      label: 'Print Area: 8.5cm × 7.5cm (Reverse View)',
      guideText: 'Add reverse side artwork',
      subGuideText: 'Choose a design tool to begin',
    },
  },

  bag: {
    type: 'bag',
    name: 'Custom Bags & Backpacks',
    label: 'Custom Corporate Bag',
    categorySlug: 'bags',
    supportsBack: true,
    requiresSize: false,
    colorLabel: 'BAG COLOR',
    secondaryColorLabel: 'TRIM & ACCENTS',
    addTextButtonLabel: '+ Add Text to Bag',
    defaultColor: 'Charcoal Black',
    defaultSecondaryColor: 'Charcoal Black',
    frontPrintableArea: {
      width: 190,
      height: 170,
      top: '35%',
      left: '31%',
      styleWidth: '38%',
      styleHeight: '30%',
      label: 'Branding Area: 12cm × 10cm (Front Panel)',
      guideText: 'Add your corporate logo or artwork',
      subGuideText: 'Choose a design tool to begin',
    },
    backPrintableArea: {
      width: 180,
      height: 140,
      top: '36%',
      left: '32%',
      styleWidth: '36%',
      styleHeight: '26%',
      label: 'Branding Area: Upper Back / Strap',
      guideText: 'Add rear branding or label',
      subGuideText: 'Choose a design tool to begin',
    },
  },

  hoodie: {
    type: 'hoodie',
    name: 'Custom Hoodies',
    label: 'Custom Hoodie',
    categorySlug: 'hoodies',
    supportsBack: true,
    requiresSize: true,
    colorLabel: 'BODY COLOR',
    secondaryColorLabel: 'HOOD LINING COLOR',
    addTextButtonLabel: '+ Add Text to Hoodie',
    defaultColor: 'Charcoal Black',
    defaultSecondaryColor: 'Charcoal Black',
    frontPrintableArea: {
      width: 210,
      height: 280,
      top: '24%',
      left: '29%',
      styleWidth: '42%',
      styleHeight: '48%',
      label: 'Print Area: 30cm × 40cm',
      guideText: 'Add your logo, text or artwork',
      subGuideText: 'Choose a design tool to begin',
    },
    backPrintableArea: {
      width: 210,
      height: 300,
      top: '24%',
      left: '29%',
      styleWidth: '42%',
      styleHeight: '52%',
      label: 'Back Print Area: 30cm × 40cm',
      guideText: 'Add your back print artwork',
      subGuideText: 'Choose a design tool to begin',
    },
  },

  generic: {
    type: 'generic',
    name: 'Custom Product',
    label: 'Custom Product',
    categorySlug: 'all',
    supportsBack: false,
    requiresSize: false,
    colorLabel: 'PRODUCT COLOR',
    addTextButtonLabel: '+ Add Text to Product',
    defaultColor: 'Charcoal Black',
    frontPrintableArea: {
      width: 200,
      height: 200,
      top: '25%',
      left: '25%',
      styleWidth: '50%',
      styleHeight: '50%',
      label: 'Standard Customization Area',
      guideText: 'Add your logo or artwork',
      subGuideText: 'Choose a design tool to begin',
    },
  },
};

const TYPE_MATCHERS: Array<[ProductTemplateType, RegExp]> = [
  ['cap', /\b(caps?|headwear|snapback)\b/],
  ['mug', /\b(mugs?|drinkware|bottles?|cups?|tumblers?)\b/],
  ['bag', /\b(bags?|backpacks?)\b/],
  ['hoodie', /\b(hoodies?|sweatshirts?)\b/],
  ['tshirt', /\b(t-?shirts?|tees?|shirts?|polos?|apparel)\b/],
];

function matchType(fields: string[]): ProductTemplateType | null {
  for (const [type, pattern] of TYPE_MATCHERS) {
    if (fields.some((f) => pattern.test(f))) return type;
  }
  return null;
}

/**
 * Resolves the visual template, printable area, and interaction rules for any catalog product.
 * Category is authoritative; product slug/name are only consulted when the category says nothing.
 * Whole-word matching avoids false positives such as "capacity" -> cap.
 */
export function getCustomizerTemplate(product: any): CustomizerTemplate {
  if (!product) return TEMPLATES.tshirt;

  // 1. Reusable Customizer Template priority (Step 9 & 11)
  const templateId = product.customizerTemplateId || product.customizerTemplate?.id;
  if (templateId) {
    const reusable = getReusableTemplateById(templateId);
    const templateObj = (reusable && reusable.active !== false ? reusable : null) || (product.customizerTemplate && product.customizerTemplate.active !== false ? product.customizerTemplate : null);
    if (templateObj) {
      const frontArea = templateObj.printAreas?.find((p: any) => p.side === 'front');
      const backArea = templateObj.printAreas?.find((p: any) => p.side === 'back');
      const bodyGroup = templateObj.colorGroups?.find((g: any) => g.id === 'BODY');
      const trimGroup = templateObj.colorGroups?.find((g: any) => g.id === 'TRIM');

      const frontWidth = frontArea
        ? frontArea.width <= 1
          ? Math.round(frontArea.width * 500)
          : frontArea.width
        : 210;
      const frontHeight = frontArea
        ? frontArea.height <= 1
          ? Math.round(frontArea.height * 500)
          : frontArea.height
        : 300;
      const frontTop = frontArea?.top ?? (frontArea ? `${(frontArea.y * 100).toFixed(1)}%` : '22.4%');
      const frontLeft = frontArea?.left ?? (frontArea ? `${(frontArea.x * 100).toFixed(1)}%` : '29%');
      const frontStyleWidth = frontArea?.styleWidth ?? (frontArea ? `${(frontArea.width <= 1 ? frontArea.width * 100 : (frontArea.width / 500) * 100).toFixed(1)}%` : '42%');
      const frontStyleHeight = frontArea?.styleHeight ?? (frontArea ? `${(frontArea.height <= 1 ? frontArea.height * 100 : (frontArea.height / 500) * 100).toFixed(1)}%` : '52%');

      const frontPrintableArea: PrintableAreaConfig = {
        width: frontWidth,
        height: frontHeight,
        top: frontTop,
        left: frontLeft,
        styleWidth: frontStyleWidth,
        styleHeight: frontStyleHeight,
        label: frontArea?.label ?? 'Print Area: 30cm × 40cm',
        guideText: frontArea?.guideText ?? 'Add your logo, text or artwork',
        subGuideText: frontArea?.subGuideText ?? 'Select an option from the design tools to begin',
      };

      const backWidth = backArea
        ? backArea.width <= 1
          ? Math.round(backArea.width * 500)
          : backArea.width
        : 210;
      const backHeight = backArea
        ? backArea.height <= 1
          ? Math.round(backArea.height * 500)
          : backArea.height
        : 300;
      const backTop = backArea?.top ?? (backArea ? `${(backArea.y * 100).toFixed(1)}%` : '22.4%');
      const backLeft = backArea?.left ?? (backArea ? `${(backArea.x * 100).toFixed(1)}%` : '29%');
      const backStyleWidth = backArea?.styleWidth ?? (backArea ? `${(backArea.width <= 1 ? backArea.width * 100 : (backArea.width / 500) * 100).toFixed(1)}%` : '42%');
      const backStyleHeight = backArea?.styleHeight ?? (backArea ? `${(backArea.height <= 1 ? backArea.height * 100 : (backArea.height / 500) * 100).toFixed(1)}%` : '52%');

      const backPrintableArea: PrintableAreaConfig | undefined = templateObj.supportsBack && backArea ? {
        width: backWidth,
        height: backHeight,
        top: backTop,
        left: backLeft,
        styleWidth: backStyleWidth,
        styleHeight: backStyleHeight,
        label: backArea.label ?? 'Back Print Area: 30cm × 40cm',
        guideText: backArea.guideText ?? 'Add your back print artwork',
        subGuideText: backArea.subGuideText ?? 'Choose a design tool to begin',
      } : undefined;

      const type: ProductTemplateType =
        templateObj.id.startsWith('cap') ? 'cap' :
        templateObj.id.startsWith('mug') ? 'mug' :
        templateObj.id.startsWith('bag') ? 'bag' :
        templateObj.id.startsWith('hoodie') ? 'hoodie' : 'tshirt';

      const effectiveSupportsBack = templateObj.supportsBack && product?.backDesignEnabled !== false;
      const effectiveSecondaryColorLabel = product?.trimColorEnabled !== false && trimGroup ? trimGroup.label : undefined;

      return {
        type,
        name: templateObj.name,
        label: templateObj.name,
        categorySlug: templateObj.categoryCompatibility[0] || 'apparel',
        supportsBack: effectiveSupportsBack,
        requiresSize: type === 'tshirt' || type === 'hoodie',
        colorLabel: bodyGroup?.label || 'BODY COLOR',
        secondaryColorLabel: effectiveSecondaryColorLabel,
        addTextButtonLabel: '+ Add Text to Product',
        defaultColor: bodyGroup?.defaultColor || 'White',
        defaultSecondaryColor: trimGroup?.defaultColor || 'White',
        frontPrintableArea,
        backPrintableArea: effectiveSupportsBack ? backPrintableArea : undefined,
      };
    }
  }

  // 2. Legacy category/product matcher fallback (Step 11)
  const catSlug = product.category?.slug?.toLowerCase() || '';
  const catName = product.category?.name?.toLowerCase() || '';
  const prodSlug = product.slug?.toLowerCase() || '';
  const prodName = product.name?.toLowerCase() || '';

  const type = matchType([catSlug, catName]) || matchType([prodSlug, prodName]);
  return type ? TEMPLATES[type] : TEMPLATES.generic;
}
