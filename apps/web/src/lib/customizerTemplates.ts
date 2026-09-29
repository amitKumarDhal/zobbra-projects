/**
 * ZOBBRA Product Customizer Template Resolver
 * Centralized registry mapping products and categories to their visual mockups,
 * printable areas, Front/Back capabilities, and styling configurations.
 */

export type ProductTemplateType = 'tshirt' | 'cap' | 'mug' | 'bag' | 'hoodie' | 'generic';

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

  const catSlug = product.category?.slug?.toLowerCase() || '';
  const catName = product.category?.name?.toLowerCase() || '';
  const prodSlug = product.slug?.toLowerCase() || '';
  const prodName = product.name?.toLowerCase() || '';

  const type = matchType([catSlug, catName]) || matchType([prodSlug, prodName]);
  return type ? TEMPLATES[type] : TEMPLATES.generic;
}
