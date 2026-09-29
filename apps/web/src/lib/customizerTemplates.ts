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
      subGuideText: 'Center or placement on back',
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
      subGuideText: 'Embroidery area (10cm × 5.5cm)',
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
      subGuideText: 'Back arch embroidery',
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
      subGuideText: 'Ceramic print area (8.5cm × 7.5cm)',
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
      subGuideText: 'Ceramic print area (8.5cm × 7.5cm)',
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
      subGuideText: 'Front panel branding area (12cm × 10cm)',
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
      subGuideText: 'Back panel / strap area',
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
      subGuideText: 'Front chest printable area',
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
      subGuideText: 'Center or placement on back',
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
      subGuideText: 'Standard branding area',
    },
  },
};

/**
 * Resolves the visual template, printable area, and interaction rules for any catalog product.
 */
export function getCustomizerTemplate(product: any): CustomizerTemplate {
  if (!product) return TEMPLATES.tshirt;

  const catSlug = product.category?.slug?.toLowerCase() || '';
  const catName = product.category?.name?.toLowerCase() || '';
  const prodSlug = product.slug?.toLowerCase() || '';
  const prodName = product.name?.toLowerCase() || '';

  // 1. Cap & Headwear
  if (
    catSlug === 'caps' ||
    catSlug.includes('cap') ||
    catName.includes('cap') ||
    catName.includes('headwear') ||
    prodSlug.includes('cap') ||
    prodName.includes('cap') ||
    prodName.includes('snapback')
  ) {
    return TEMPLATES.cap;
  }

  // 2. Mugs, Drinkware & Bottles
  if (
    catSlug === 'drinkware' ||
    catSlug.includes('mug') ||
    catSlug.includes('bottle') ||
    catName.includes('mug') ||
    catName.includes('drinkware') ||
    catName.includes('bottle') ||
    prodSlug.includes('mug') ||
    prodSlug.includes('bottle') ||
    prodSlug.includes('cup') ||
    prodName.includes('mug') ||
    prodName.includes('bottle') ||
    prodName.includes('cup')
  ) {
    return TEMPLATES.mug;
  }

  // 3. Bags & Backpacks
  if (
    catSlug === 'bags' ||
    catSlug.includes('bag') ||
    catName.includes('bag') ||
    catName.includes('backpack') ||
    prodSlug.includes('backpack') ||
    prodSlug.includes('bag') ||
    prodName.includes('backpack') ||
    prodName.includes('bag')
  ) {
    return TEMPLATES.bag;
  }

  // 4. Hoodies & Sweatshirts
  if (
    catSlug === 'hoodies' ||
    catSlug.includes('hoodie') ||
    catName.includes('hoodie') ||
    catName.includes('sweatshirt') ||
    prodSlug.includes('hoodie') ||
    prodName.includes('hoodie')
  ) {
    return TEMPLATES.hoodie;
  }

  // 5. T-Shirts & Apparel
  if (
    catSlug === 't-shirts' ||
    catSlug.includes('t-shirt') ||
    catSlug.includes('shirt') ||
    catName.includes('t-shirt') ||
    catName.includes('apparel') ||
    prodSlug.includes('polo') ||
    prodSlug.includes('t-shirt') ||
    prodSlug.includes('tshirt') ||
    prodName.includes('polo') ||
    prodName.includes('t-shirt')
  ) {
    return TEMPLATES.tshirt;
  }

  // Fallback to generic template
  return TEMPLATES.generic;
}
