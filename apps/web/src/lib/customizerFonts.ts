/**
 * Web fonts offered in the customizer's text tool.
 *
 * The Fabric canvas draws text with the font's real family name ("Outfit", "Montserrat", …), so
 * the fonts are loaded from Google Fonts under those names. next/font cannot be used here: it
 * renames families. Text must be measured again once a font arrives, or it keeps the fallback
 * font's width.
 */
import { FONTS } from '@/components/customizer/customizerOptions';

const STYLESHEET_ID = 'zobbra-customizer-fonts';

const STYLESHEET_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:ital,wght@0,400;0,700;1,400;1,700' +
  '&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700' +
  '&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700' +
  '&family=Outfit:wght@400;700' +
  '&family=Roboto:ital,wght@0,400;0,700;1,400;1,700' +
  '&display=swap';

let stylesheetReady: Promise<void> | null = null;

/**
 * Adds the stylesheet once and resolves when it has loaded. Until then the @font-face rules do not
 * exist, and document.fonts.load() would resolve straight away without loading anything.
 */
function ensureStylesheet(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!stylesheetReady) {
    stylesheetReady = new Promise<void>((resolve) => {
      const existing = document.getElementById(STYLESHEET_ID) as HTMLLinkElement | null;
      if (existing?.sheet) return resolve();
      const link = existing || document.createElement('link');
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => resolve(), { once: true });
      if (!existing) {
        link.id = STYLESHEET_ID;
        link.rel = 'stylesheet';
        link.href = STYLESHEET_URL;
        document.head.appendChild(link);
      }
    });
  }
  return stylesheetReady;
}

/** Resolves once this family/weight/style can be drawn (or once loading it has failed). */
export async function loadCustomizerFont(family: string, weight: string = 'normal', style: string = 'normal') {
  await ensureStylesheet();
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.load(`${style} ${weight} 32px "${family}"`);
  } catch {
    // Offline or blocked: the canvas keeps the fallback font.
  }
}

/** Loads every customizer font in the regular and bold weights. */
export function preloadCustomizerFonts() {
  return Promise.all(
    FONTS.flatMap((f) => [loadCustomizerFont(f.value, 'normal'), loadCustomizerFont(f.value, 'bold')])
  );
}

const TEXT_TYPES = new Set(['i-text', 'text', 'textbox']);

export function isTextObject(obj: any): boolean {
  return !!obj && TEXT_TYPES.has(obj.type);
}
