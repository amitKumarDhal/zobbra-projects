/**
 * ZOBBRA Customizer Draft Persistence & Safe Recovery Engine
 * Key: zobbra_customizer_draft_v1
 * Versioned, multi-tab safe, and excludes any sensitive credentials.
 */

export interface CustomizerVariant {
  color?: string;
  size?: string;
  quantity: number;
}

export interface CustomizerDraft {
  draftId: string;
  productId: string;
  productName: string;
  selectedColor: string;
  collarColor?: string;
  frontCanvasJson?: string;
  backCanvasJson?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  /** Original customer-uploaded artwork Cloudinary URL (before rendering onto garment) */
  originalArtworkUrl?: string;
  quantity: number;
  variants: CustomizerVariant[];
  printPosition: 'Front' | 'Back' | 'Both' | 'Front Only' | 'Back Only' | 'Front & Back' | string;
  printingType?: string;
  notes?: string;
  timestamp: number;
}

const DRAFT_STORAGE_KEY = 'zobbra_customizer_draft_v1';
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveCustomizerDraft(draft: Omit<CustomizerDraft, 'timestamp' | 'draftId'> & { draftId?: string }): CustomizerDraft {
  if (typeof window === 'undefined') {
    return {
      draftId: draft.draftId || 'temp',
      ...draft,
      timestamp: Date.now(),
    };
  }

  const completeDraft: CustomizerDraft = {
    ...draft,
    draftId: draft.draftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(completeDraft));
    // Also save by product ID for quick multi-product reference
    localStorage.setItem(`${DRAFT_STORAGE_KEY}_${draft.productId}`, JSON.stringify(completeDraft));
  } catch (err) {
    console.warn('[CustomizerDraft] Failed to save draft to localStorage:', err);
  }

  return completeDraft;
}

export function getCustomizerDraft(productId?: string): CustomizerDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = productId
      ? localStorage.getItem(`${DRAFT_STORAGE_KEY}_${productId}`) || localStorage.getItem(DRAFT_STORAGE_KEY)
      : localStorage.getItem(DRAFT_STORAGE_KEY);

    if (!raw) return null;

    const parsed: CustomizerDraft = JSON.parse(raw);

    // Validate structure & expiration
    if (!parsed || !parsed.productId || !parsed.timestamp) {
      clearCustomizerDraft(productId);
      return null;
    }

    if (Date.now() - parsed.timestamp > DRAFT_MAX_AGE_MS) {
      clearCustomizerDraft(productId);
      return null;
    }

    // If productId requested, verify match
    if (productId && parsed.productId !== productId) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[CustomizerDraft] Failed to parse draft from localStorage:', err);
    return null;
  }
}

export function clearCustomizerDraft(productId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    if (productId) {
      localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${productId}`);
    }
  } catch (err) {
    console.warn('[CustomizerDraft] Failed to clear draft from localStorage:', err);
  }
}

/**
 * Validates returnUrl to strictly prevent open redirect vulnerabilities.
 * Only allows local routes starting with `/` and belonging to the application.
 */
export function sanitizeReturnUrl(returnUrl: string | null | undefined): string | null {
  if (!returnUrl || typeof returnUrl !== 'string') return null;

  const trimmed = returnUrl.trim();

  // Reject external protocols, double slashes, javascript:, data:
  if (
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:')
  ) {
    return null;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith('/')) {
    return null;
  }

  return trimmed;
}
