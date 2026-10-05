/** Colour-name → hex lookup used wherever a product colour has no explicit colour value. */
export const COLOR_HEX_MAP: Record<string, string> = {
  white: '#FFFFFF',
  'classic white': '#F9FAFB',
  'pure white': '#FFFFFF',
  red: '#FF0000',
  'crimson red': '#DC2626',
  'charcoal black': '#2B2B2B',
  black: '#171717',
  'matte black': '#1C1C1E',
  yellow: '#FFD700',
  orange: '#FF7A00',
  green: '#00C853',
  'olive green': '#4D5D3A',
  gold: '#E5A100',
  'royal blue': '#0038FF',
  blue: '#0038FF',
  purple: '#5B0082',
  'sky blue': '#29B6F6',
  'hot pink': '#E91E63',
  pink: '#E91E63',
  maroon: '#7B1113',
  'royal maroon': '#7B1113',
  lime: '#AEEA00',
  'lime green': '#AEEA00',
  'navy blue': '#0D1333',
  navy: '#0D1333',
  'heather grey': '#9E9E9E',
  'heather gray': '#9E9E9E',
  grey: '#9E9E9E',
  gray: '#9E9E9E',
  'bottle green': '#0B3B24',
  'forest green': '#0B3B24',
  cream: '#FDF5E6',
  beige: '#FDF5E6',
};

export function getColorHex(colorName: string): string {
  if (!colorName) return '#2B2B2B';
  const clean = colorName.trim().toLowerCase();
  if (clean.startsWith('#') || clean.startsWith('rgb')) return clean;
  return COLOR_HEX_MAP[clean] || '#262626';
}

export function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160;
}
