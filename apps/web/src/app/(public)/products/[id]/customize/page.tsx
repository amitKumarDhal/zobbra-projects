'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Check,
  UserCheck,
  X,
  ShoppingCart,
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import { VariantData } from '@/components/shared/VariantBreakdownEntry';
import { 
  saveCustomizerDraft, 
  getCustomizerDraft, 
  clearCustomizerDraft, 
  CustomizerDraft 
} from '@/lib/customizerDraft';
import { getCustomizerTemplate } from '@/lib/customizerTemplates';
import { applyCustomizerViews, getSideRecolor, isBackSideEnabled } from '@/lib/customizerViews';
import {
  canCustomize,
  getCustomizerFeatures,
  getDefaultQuantity,
  getOfferAddon,
  getProductColors,
  getProductCollarColors,
  getProductSizes,
  getUnitPrice,
  productRequiresSize,
} from '@/lib/productConfig';
import { OrderReviewSheet } from '@/components/customizer/OrderReviewSheet';
import { WhatsAppOtpLogin, OtpLoginSuccess } from '@/components/auth/WhatsAppOtpLogin';
import { storeSession } from '@/lib/otpAuth';
import type { CustomizerCanvasRef, CustomizerCanvasProps } from '@/components/customizer/CustomizerCanvas';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getColorHex, isLightColor } from '@/lib/colors';
import { isTextObject } from '@/lib/customizerFonts';
import { StageScaler } from '@/components/customizer/StageScaler';
import { getBackdropImage } from '@/components/customizer/GarmentBackdrop';
import { BottomSheet } from '@/components/customizer/BottomSheet';
import type { PricingState } from '@/components/customizer/OrderPanel';
import {
  ToolRail,
  UploadPanel,
  TextPanel,
  ColorPanel,
  SelectionPanel,
  TOOL_TITLES,
  PANEL_HEADING,
  type ToolKey,
  type TextValue,
} from '@/components/customizer/ToolPanels';

// Desktop/tablet side panel shows these three; element controls appear contextually below them.
// Mobile keeps its Layers tab in the bottom navigation.
const PANEL_TOOLS: ToolKey[] = ['colors', 'logo', 'text'];
const MOBILE_TOOLS: ToolKey[] = ['colors', 'logo', 'text', 'layers'];
// Section headings in the side panel (the Colors panel carries its own "BODY COLOR" style headings).
const PANEL_SECTION_TITLES: Partial<Record<ToolKey, string>> = {
  logo: 'Upload logo',
  text: 'Add text',
};

// Natural size of the customizer stage (matches CustomizerCanvas: max-w-[540px], aspect 500/580).
const STAGE_WIDTH = 540;
const STAGE_HEIGHT = 626.4;

// Dynamically import Fabric canvas with SSR disabled to prevent server-side canvas.node crash
const DynamicCanvas = dynamic(
  () => import('@/components/customizer/CustomizerCanvas').then(mod => mod.CustomizerCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full flex items-center justify-center bg-[#FAFAFA] rounded-2xl border border-[#E5E7EB]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#3B6FEB] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading Customizer Studio...</p>
        </div>
      </div>
    ),
  }
);

function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const CustomizerCanvas = React.forwardRef<CustomizerCanvasRef, CustomizerCanvasProps>((props, ref) => {
  const DynamicComp = DynamicCanvas as any;
  return <DynamicComp {...props} innerRef={ref} />;
});
CustomizerCanvas.displayName = 'CustomizerCanvas';

function CustomizeProductContent({ productId }: { productId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResume = searchParams.get('resume') === '1';

  const { user: cachedUser } = useCustomerUser();
  // Set when a guest verifies their WhatsApp number in the Proceed step (no page reload happens).
  const [verifiedUser, setVerifiedUser] = useState<OtpLoginSuccess['user'] | null>(null);
  const user = verifiedUser ?? cachedUser;

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Active side and tool tab
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [activeToolTab, setActiveToolTab] = useState<ToolKey>('colors');
  const [mobileSheet, setMobileSheet] = useState<ToolKey | null>(null);
  // Side-panel layout from tablet width up; bottom sheets below.
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Garment & Order specs (real catalog data)
  const [selectedColor, setSelectedColor] = useState<string>('White');
  const [collarColor, setCollarColor] = useState<string>('Yellow');
  const [tapingColor, setTapingColor] = useState<string>('White');
  const [brandingMethod, setBrandingMethod] = useState<'Print' | 'Embroidery'>('Print');
  const [quantity, setQuantity] = useState<number>(50);
  const [variants, setVariants] = useState<VariantData[]>([]);

  // Design presence
  const [hasFront, setHasFront] = useState<boolean>(false);
  const [hasBack, setHasBack] = useState<boolean>(false);

  // Text tool form inputs
  const [textInput, setTextInput] = useState<string>('');
  const [textFont, setTextFont] = useState<string>('Outfit');
  const [textFontSize, setTextFontSize] = useState<number>(24);
  const [textColorPick, setTextColorPick] = useState<string | null>(null);
  const [textBold, setTextBold] = useState<boolean>(true);
  const [textItalic, setTextItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  // This product's colours (admin configuration). A colour's own value wins over the name lookup.
  const productColors = getProductColors(product);
  const hexOf = (name: string) =>
    productColors.find((c) => c.name.toLowerCase() === (name || '').toLowerCase())?.hex || getColorHex(name);
  // Default text color contrasts with the product color unless the customer picked one.
  const textColor = textColorPick ?? (isLightColor(hexOf(selectedColor)) ? '#111111' : '#FFFFFF');

  // Selected canvas object inspector. The canvas reports the same object again after it is resized,
  // so a counter makes the panel re-read it.
  const [selectedCanvasObj, setSelectedCanvasObj] = useState<any>(null);
  const [selectionVersion, setSelectionVersion] = useState<number>(0);
  const handleSelectionChange = useCallback((obj: any) => {
    setSelectedCanvasObj(obj);
    setSelectionVersion((v) => v + 1);
  }, []);
  const selectedText = isTextObject(selectedCanvasObj) ? selectedCanvasObj : null;

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<boolean>(false);
  const [restoredDraft, setRestoredDraft] = useState<CustomizerDraft | null>(null);

  // Guest → WhatsApp OTP verification, shown over the checkout step when Request quote is clicked
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Checkout step: quantity/sizes, free gift, offer addon and the server price, shown on Proceed
  const [showReview, setShowReview] = useState<boolean>(false);
  const [addonSelected, setAddonSelected] = useState<boolean>(false);

  // Live server pricing (pricing-preview), displayed in the checkout step
  const [pricingState, setPricingState] = useState<PricingState>({ status: 'idle' });

  const canvasRef = useRef<CustomizerCanvasRef>(null);

  // Synchronize restoredDraft into canvas once canvasRef is mounted
  useEffect(() => {
    if (restoredDraft && canvasRef.current) {
      canvasRef.current.loadDraftState(
        restoredDraft.frontCanvasJson,
        restoredDraft.backCanvasJson,
        restoredDraft.originalArtworkUrl
      );
    }
  }, [restoredDraft]);

  // Load product catalog details
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoadingProduct(true);
        let res = await fetch(`${API_URL}/products/${productId}`);
        if (!res.ok && (productId === 'prod-polo-200gsm' || productId?.includes('polo'))) {
          res = await fetch(`${API_URL}/products/classic-corporate-polo-tshirt`);
        }
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        const prod = data.product || data.data || data;
        setProduct(prod);

        // Initial colour, size and quantity come from the product's own configuration
        const moq = getDefaultQuantity(prod);
        setQuantity(moq);

        const initialTemplate = getCustomizerTemplate(prod);
        const configuredColors = getProductColors(prod);
        const configuredCollarColors = getProductCollarColors(prod);
        const defaultColor = configuredColors[0]?.name || (
          initialTemplate.type === 'cap' ? 'Charcoal Black' : 'White'
        );
        // Trim/collar starts in the product's configured collar colour (e.g. Yellow if available, or first collar color)
        const defaultCollar = configuredCollarColors.find(c => c.name.toLowerCase() === 'yellow')?.name ||
          configuredCollarColors[0]?.name ||
          (configuredColors.length > 0
            ? defaultColor
            : initialTemplate.type === 'cap'
            ? 'Charcoal Black'
            : 'Yellow');
        const defaultSize = productRequiresSize(prod) ? getProductSizes(prod)[0] || 'L' : 'Free Size';
        const defaultTaping = defaultColor;

        // ONLY restore draft if user is resuming from login/register flow
        if (isResume) {
          const savedDraft = getCustomizerDraft(prod.id);
          if (savedDraft) {
            setRestoredDraft(savedDraft);
            setSelectedColor(savedDraft.selectedColor || defaultColor);
            if (savedDraft.collarColor) setCollarColor(savedDraft.collarColor);
            else setCollarColor(defaultCollar);
            if ((savedDraft as any).tapingColor) setTapingColor((savedDraft as any).tapingColor);
            else setTapingColor(defaultTaping);
            if ((savedDraft as any).brandingMethod) setBrandingMethod((savedDraft as any).brandingMethod);
            if (savedDraft.quantity) setQuantity(savedDraft.quantity);
            if (savedDraft.addonSelected) setAddonSelected(true);
            if (savedDraft.variants && savedDraft.variants.length > 0) {
              setVariants(savedDraft.variants);
            } else {
              setVariants([{ color: savedDraft.selectedColor || defaultColor, size: defaultSize, quantity: savedDraft.quantity || moq }]);
            }
            if (canvasRef.current) {
              canvasRef.current.loadDraftState(
                savedDraft.frontCanvasJson,
                savedDraft.backCanvasJson,
                savedDraft.originalArtworkUrl
              );
            }
            setDraftRestoredNotice(true);
            setTimeout(() => setDraftRestoredNotice(false), 6000);
          } else {
            setSelectedColor(defaultColor);
            setCollarColor(defaultCollar);
            setTapingColor(defaultTaping);
            setVariants([{ color: defaultColor, size: defaultSize, quantity: moq }]);
          }
        } else {
          // Fresh, clean start matching design studio reference
          setSelectedColor(defaultColor);
          setCollarColor(defaultCollar);
          setTapingColor(defaultTaping);
          setVariants([{ color: defaultColor, size: defaultSize, quantity: moq }]);
        }
      } catch (err: any) {
        setProductError(err.message || 'Unable to load product specifications.');
      } finally {
        setLoadingProduct(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId, isResume]);

  // Handle body color change: updates the garment silhouette, and the order lines in that colour follow it.
  const handleColorChange = (col: string) => {
    setVariants(prev =>
      prev.map(v => ((v.color || '').toLowerCase() === selectedColor.toLowerCase() ? { ...v, color: col } : v))
    );
    setSelectedColor(col);
  };

  // Handle collar & rib color change: updates collar, placket, and sleeve cuff ribbing
  const handleCollarColorChange = (col: string) => {
    setCollarColor(col);
  };

  // Test helper hook for automated verification in browser tests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__addCustomizerFile = async (f: File) => {
        if (!canvasRef.current) {
          throw new Error('canvasRef.current is not mounted yet');
        }
        return canvasRef.current.addImage(f);
      };
      (window as any).__getCanvasRef = () => canvasRef.current;
    }
  });

  // Resolve customizer template for current product, with the admin's front/back view settings.
  // Memoized so the canvas only re-applies its geometry when the product changes.
  const template = useMemo(() => applyCustomizerViews(getCustomizerTemplate(product), product), [product]);
  const backEnabled = isBackSideEnabled(product);
  const customizerFeatures = useMemo(() => getCustomizerFeatures(product), [product]);
  const sides = backEnabled ? (['front', 'back'] as const) : (['front'] as const);
  const isCap = template.type === 'cap';

  // Guard against navigating to back view if back design is disabled
  useEffect(() => {
    if (!backEnabled && activeSide === 'back') {
      setActiveSide('front');
    }
  }, [backEnabled, activeSide]);

  // Determine active print positions
  const resolvedPrintType = hasFront && hasBack 
    ? 'Front & Back' 
    : hasBack 
    ? 'Back Only' 
    : 'Front Only';

  // Variant quantity sum validation
  const variantSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  const hasVariantMismatch = variants.length > 0 && variantSum !== quantity;

  // Live server pricing via POST /api/v1/quotes/pricing-preview. Guests (no token) get an estimate
  // from the product's own quantity pricing; the server recalculates every quote regardless.
  const fetchPricing = useCallback(
    debounce(async (pid: string, qty: number, pt: string, vars: VariantData[], prodObj: any, withAddon: boolean) => {
      if (!pid || qty <= 0) {
        setPricingState({ status: 'idle' });
        return;
      }

      // Variant quantity sum must equal total quantity
      if (vars.length > 0) {
        const sum = vars.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
        if (sum !== qty) {
          setPricingState({ status: 'idle' });
          return;
        }
      }

      setPricingState({ status: 'loading' });

      const guestEstimate = () => {
        const unitPrice = getUnitPrice(prodObj, qty);
        // Mirrors the server's resolveAddonAmount so a guest sees the addon they tick
        const addon = withAddon ? getOfferAddon(prodObj) : null;
        const addonAmount = addon ? (addon.priceType === 'PER_PIECE' ? addon.price * qty : addon.price) : 0;
        const subtotal = unitPrice * qty + addonAmount;
        const gstRate = prodObj?.gstRate ?? 5;
        const gstTotal = Math.round(subtotal * (gstRate / 100));
        setPricingState({
          status: 'success',
          data: {
            productId: pid,
            productName: prodObj?.name || 'Product',
            unitPrice,
            addonAmount,
            subtotal,
            discount: 0,
            gstRate,
            gstTotal,
            totalAmount: subtotal + gstTotal,
          },
        });
      };

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
          : null;
      if (!token) return guestEstimate();

      try {
        const body: { productId: string; quantity: number; printType: string; addonSelected: boolean; variants?: VariantData[] } = {
          productId: pid,
          quantity: qty,
          printType: pt || 'Front Only',
          addonSelected: withAddon,
        };
        if (vars.length > 0) body.variants = vars;

        const res = await fetch(`${API_URL}/quotes/pricing-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setPricingState({ status: 'success', data: data.data });
        } else if (res.status === 401) {
          guestEstimate();
        } else {
          setPricingState({
            status: 'error',
            message: data.message || 'Unable to calculate estimate. Please try again.',
          });
        }
      } catch {
        setPricingState({ status: 'error', message: 'Network error calculating pricing preview.' });
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (product?.id && quantity > 0) {
      const varsToSend = variants.length > 0
        ? variants
        : [{ color: selectedColor, size: productRequiresSize(product) ? 'L' : 'Free Size', quantity }];
      fetchPricing(product.id, quantity, resolvedPrintType, varsToSend, product, addonSelected);
    } else {
      setPricingState({ status: 'idle' });
    }
  }, [product, quantity, resolvedPrintType, variants, selectedColor, addonSelected, verifiedUser, fetchPricing]);

  // Handle Side Switcher. The canvas owns the switch and reports the side it actually moved to via
  // onSideChange, so the toggle never runs ahead of a switch that is still loading (or deferred).
  const handleSwitchSide = (side: 'front' | 'back') => {
    if (side === 'back' && !backEnabled) return;
    if (canvasRef.current) {
      canvasRef.current.switchSide(side);
    } else {
      setActiveSide(side);
    }
  };

  // Add user's custom text to the garment
  const handleCreateText = () => {
    if (!textInput.trim() || !canvasRef.current) return;

    canvasRef.current.addText(textInput.trim(), {
      fontFamily: textFont,
      fontSize: textFontSize,
      fill: textColor,
      fontWeight: textBold ? 'bold' : 'normal',
      fontStyle: textItalic ? 'italic' : 'normal',
      textAlign,
    });

    setTextInput('');
  };

  // Selecting a text on the product loads its settings into the Text panel, so the controls edit it.
  const wasEditingTextRef = useRef(false);
  useEffect(() => {
    if (selectedText) {
      wasEditingTextRef.current = true;
      setTextInput(selectedText.text || '');
      setTextFont(selectedText.fontFamily || 'Outfit');
      setTextFontSize(Math.round((selectedText.fontSize || 24) * (selectedText.scaleY || 1)));
      if (typeof selectedText.fill === 'string') setTextColorPick(selectedText.fill);
      setTextBold(String(selectedText.fontWeight) === 'bold' || Number(selectedText.fontWeight) >= 600);
      setTextItalic(selectedText.fontStyle === 'italic');
      setTextAlign((selectedText.textAlign as 'left' | 'center' | 'right') || 'center');
    } else if (wasEditingTextRef.current) {
      // Leaving edit mode: the field is for the next new text again.
      wasEditingTextRef.current = false;
      setTextInput('');
    }
  }, [selectedText, selectionVersion]);

  const handleTextChange = (patch: Partial<TextValue>) => {
    if (selectedText && canvasRef.current) {
      const updates: Record<string, unknown> = {};
      if (patch.text !== undefined && patch.text.trim()) updates.text = patch.text;
      if (patch.font !== undefined) updates.fontFamily = patch.font;
      // The panel shows the on-screen size, so a resized text keeps its scale.
      if (patch.size !== undefined) updates.fontSize = patch.size / (selectedText.scaleY || 1);
      if (patch.color !== undefined) updates.fill = patch.color;
      if (patch.bold !== undefined) updates.fontWeight = patch.bold ? 'bold' : 'normal';
      if (patch.italic !== undefined) updates.fontStyle = patch.italic ? 'italic' : 'normal';
      if (patch.align !== undefined) updates.textAlign = patch.align;
      if (Object.keys(updates).length > 0) canvasRef.current.updateActiveObject(updates);
    }
    if (patch.text !== undefined) setTextInput(patch.text);
    if (patch.font !== undefined) setTextFont(patch.font);
    if (patch.size !== undefined) setTextFontSize(patch.size);
    if (patch.color !== undefined) setTextColorPick(patch.color);
    if (patch.bold !== undefined) setTextBold(patch.bold);
    if (patch.italic !== undefined) setTextItalic(patch.italic);
    if (patch.align !== undefined) setTextAlign(patch.align);
  };

  // Desktop/tablet: switch the side panel's tab. Mobile: toggle its bottom sheet.
  const handleToolSelect = (key: ToolKey) => {
    if (isDesktop) {
      setActiveToolTab(key);
    } else {
      setMobileSheet((prev) => (prev === key ? null : key));
    }
  };

  // Handle logo file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Customizer] handleFileUpload called, files count:', e.target.files?.length, 'canvasRef exists:', !!canvasRef.current);
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    setIsUploadingLogo(true);
    setIsUploadingArtwork(true);
    setSubmitError(null);
    try {
      console.log('[Customizer] calling addImage with file:', file.name, file.size);
      await canvasRef.current.addImage(file);
      console.log('[Customizer] addImage and Cloudinary upload completed successfully');
    } catch (err: any) {
      console.error('[Customizer] Failed placing/uploading logo:', err);
      setSubmitError(err?.message || 'Failed to upload artwork. Please choose a valid PNG, JPG, or SVG file.');
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingArtwork(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Saves the current design to the existing guest draft (localStorage) without uploading anything:
   * canvas JSON for both sides, the already-uploaded artwork URL, colours, quantity, variants and
   * the addon choice. The live studio state is untouched; the draft only matters if the tab reloads.
   */
  const saveGuestDraft = () => {
    const state = canvasRef.current?.getCanvasState();
    saveCustomizerDraft({
      productId: product.id,
      productName: product.name,
      selectedColor,
      collarColor,
      frontCanvasJson: state?.frontJson,
      backCanvasJson: state?.backJson,
      originalArtworkUrl: canvasRef.current?.getOriginalArtworkUrl() || restoredDraft?.originalArtworkUrl || undefined,
      quantity,
      printPosition: resolvedPrintType,
      variants: variants.length > 0 ? variants : [{ color: selectedColor, size: productRequiresSize(product) ? 'L' : 'Free Size', quantity }],
      addonSelected,
    });
  };

  // A guest verified their WhatsApp number from "Request quote": place the quote they just reviewed.
  const handleOtpVerified = ({ token, user: signedIn }: OtpLoginSuccess) => {
    // The OTP endpoint only signs customers in. Anything else is never stored as this browser's session.
    if (signedIn?.role !== 'CUSTOMER') {
      setAuthNotice('This number cannot be used to place customer orders. Please use a different number.');
      return;
    }
    storeSession(token, signedIn);
    setVerifiedUser(signedIn);
    setAuthNotice(null);
    setShowAuthModal(false);
    setShowReview(true);
    // verifiedUser isn't in this render's closure yet, so the signed-in user is passed along.
    handleProceed(true, signedIn);
  };

  // The Primary "PROCEED" Submission Handler. Authentication is only required at "Request quote":
  //   signed-in customer → checkout step (quantity, sizes, offers) → quote
  //   guest              → same checkout step → "Request quote" → WhatsApp OTP → quote
  // (confirmed = true comes from the checkout step's "Request quote" button).
  const handleProceed = async (confirmed = false, sessionUser: typeof user = user) => {
    setSubmitError(null);

    const sessionToken = typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
      : null;
    if (!confirmed) {
      if (isUploadingArtwork || isUploadingLogo || canvasRef.current?.isUploadingArtwork?.()) {
        setSubmitError('Uploading artwork… Please wait for upload to complete.');
        return;
      }
      if (sessionToken && sessionUser && sessionUser.role !== 'CUSTOMER') {
        // Staff preview the studio; their session is never swapped for a customer one.
        setSubmitError('You are signed in as Admin. Sign out and continue as a customer to place an order.');
        return;
      }
      setShowReview(true);
      return;
    }

    // Validate variant breakdown sum
    const vSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    if (variants.length > 0 && vSum !== quantity) {
      setSubmitError(`Total variant quantity (${vSum}) must equal total order quantity (${quantity}).`);
      return;
    }

    // Guest: save the design and verify their number over the checkout step before anything is sent
    if (!sessionToken || sessionUser?.role !== 'CUSTOMER') {
      saveGuestDraft();
      setAuthNotice(null);
      setShowAuthModal(true);
      return;
    }

    const finalVariants = variants.length > 0
      ? variants
      : [{ color: selectedColor, size: productRequiresSize(product) ? 'L' : 'Free Size', quantity }];

    if (!canvasRef.current) return;

    // Check if artwork upload is still in progress
    if (isUploadingArtwork || isUploadingLogo || canvasRef.current.isUploadingArtwork?.()) {
      setSubmitError('Uploading artwork… Please wait for upload to complete.');
      return;
    }

    setSubmitting(true);
    setIsPreparingPreview(true);

    try {
      // 1. If an artwork upload was in-flight, ensure it finishes
      if (canvasRef.current.waitForArtworkUpload) {
        await canvasRef.current.waitForArtworkUpload();
      }

      // 2. Export rendered canvas previews (garment + placed design uploaded to Cloudinary CDN)
      const previews = await canvasRef.current.exportPreviews();
      setIsPreparingPreview(false);

      // 3. Capture raw customer-uploaded artwork (Cloudinary URL only, never base64)
      const originalArtwork = canvasRef.current.getOriginalArtworkUrl() || restoredDraft?.originalArtworkUrl;
      if (originalArtwork && originalArtwork.startsWith('data:image/')) {
        setSubmitError('Artwork upload is still processing. Please try again.');
        setSubmitting(false);
        return;
      }

      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('token') || localStorage.getItem('zobra_token') 
        : null;

      const isCustomer = sessionUser && sessionUser.role === 'CUSTOMER';
      const effectiveArtworkUrl = (originalArtwork && !originalArtwork.startsWith('data:image/'))
        ? originalArtwork
        : (previews.frontCloudinaryUrl || previews.backCloudinaryUrl || undefined);

      // Safety net: the session disappeared between Proceed and Confirm → verify again, nothing is lost
      if (!token || !isCustomer) {
        saveGuestDraft();
        setSubmitting(false);
        setShowReview(false);
        setShowAuthModal(true);
        return;
      }

      const effectiveCollarColor = customizerFeatures.trimColor ? collarColor : undefined;
      const effectiveTapingColor = customizerFeatures.taping ? tapingColor : undefined;
      const effectiveBranding = customizerFeatures.embroidery ? brandingMethod : 'Print';
      const isEmbroidery = effectiveBranding === 'Embroidery';
      const effectivePreviewBack = backEnabled ? (previews.backCloudinaryUrl || undefined) : undefined;
      const effectivePrintPosition = backEnabled ? resolvedPrintType : 'Front Only';

      // Logged-in Customer: Submit official Quote
      const quotePayload = {
        productId: product.id,
        quantity,
        color: selectedColor,
        printingType: isEmbroidery ? 'Embroidery' : 'Custom Online Design',
        printPosition: effectivePrintPosition,
        printType: isEmbroidery ? 'Embroidery Logo' : effectivePrintPosition,
        embroidery: isEmbroidery,
        tapingColor: effectiveTapingColor,
        // The server reads the addon's price from the product; only the opt-in is sent
        addonSelected,
        // Cloudinary CDN URLs only, never base64 data URLs
        artworkUrl: effectiveArtworkUrl,
        previewFrontUrl: previews.frontCloudinaryUrl || undefined,
        previewBackUrl: effectivePreviewBack,
        // Fabric canvas state snapshot (sanitized, zero base64)
        canvasStateJson: JSON.stringify({
          front: previews.frontCanvasJson,
          back: backEnabled ? previews.backCanvasJson : undefined,
        }),
        // Compact metadata only — NO duplicate base64 or preview strings!
        customizationRequirements: JSON.stringify({
          selectedColor,
          collarColor: effectiveCollarColor,
          tapingColor: effectiveTapingColor,
          brandingMethod: effectiveBranding,
          embroidery: isEmbroidery,
          printPosition: effectivePrintPosition,
          hasFront: previews.hasFront,
          hasBack: backEnabled ? previews.hasBack : false,
          variants: finalVariants,
        }),
        items: [
          {
            productId: product.id,
            printType: isEmbroidery ? 'Embroidery Logo' : effectivePrintPosition,
            printingType: isEmbroidery ? 'Embroidery' : 'Print',
            embroidery: isEmbroidery,
            color: selectedColor,
            collarColor: effectiveCollarColor,
            tapingColor: effectiveTapingColor,
            brandingMethod: effectiveBranding,
            size: finalVariants[0]?.size || (productRequiresSize(product) ? 'L' : 'Free Size'),
            quantity,
            variants: finalVariants,
          },
        ],
        notes: isCap 
          ? `Custom Online Cap Design - ${effectivePrintPosition} on ${selectedColor}${effectiveCollarColor ? ` (Visor: ${effectiveCollarColor})` : ''}${effectiveTapingColor ? ` (Taping: ${effectiveTapingColor})` : ''} [${effectiveBranding}]`
          : `Custom Online Design - ${effectivePrintPosition} on ${selectedColor}${effectiveCollarColor ? ` (${template.secondaryColorLabel || 'Secondary'}: ${effectiveCollarColor})` : ''}${effectiveTapingColor ? ` (Taping: ${effectiveTapingColor})` : ''} [${effectiveBranding}]`,
      };

      const payloadString = JSON.stringify(quotePayload);
      const payloadSize = new Blob([payloadString]).size;
      console.log(`[Customizer] Quote payload size: ${payloadSize} bytes. Contains data:image: ${payloadString.includes('data:image/')}`);

      // Final client-side guard: Reject any base64 data URLs in payload
      if (payloadString.includes('data:image/')) {
        console.error('[Customizer] Aborting submission: payload contains data:image/');
        setSubmitError('Artwork upload is still processing. Please try again.');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payloadString,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        clearCustomizerDraft(product.id);
        router.push(`/customer/quotes?created=${data.quote?.id || 'success'}`);
      } else if (res.status === 401) {
        // Expired session: keep the design and ask the customer to verify their number again
        saveGuestDraft();
        setVerifiedUser(null);
        setSubmitting(false);
        setShowReview(false);
        setAuthNotice('Your session expired. Verify your number to continue — your design is safe.');
        setShowAuthModal(true);
      } else {
        setSubmitError(data.message || 'Unable to submit quote. Please check your inputs and try again.');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'An error occurred while preparing your custom design.');
      setSubmitting(false);
      setIsPreparingPreview(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#111111] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider font-heading">Loading Studio...</h2>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-7 rounded-2xl border border-red-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-[#111111] font-heading">Product Not Found</h2>
          <p className="text-xs text-gray-600">{productError || 'The requested product could not be loaded.'}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // The admin turned customization (or the canvas designer) off for this product: no design studio.
  if (!canCustomize(product)) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6" data-cy="customizer-unavailable">
        <div className="max-w-md w-full bg-white p-7 rounded-2xl border border-[#E5E7EB] text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
          <h2 className="text-xl font-black text-[#111111] font-heading">Customization is not available for this product.</h2>
          <p className="text-xs text-gray-600">{product.name} is not available for online customization.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href={`/products/${product.id}`}
              data-cy="customizer-back-to-product"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B6FEB] text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-[#2F5FD6] transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Product
            </Link>
            <Link
              href={`/get-quote?product=${encodeURIComponent(product.name)}&qty=${getDefaultQuantity(product)}&id=${product.id}`}
              data-cy="customizer-unavailable-quote"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] border border-[#E5E7EB] text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Request a quote <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Identity state determinations
  const hasToken = typeof window !== 'undefined'
    ? !!(localStorage.getItem('token') || localStorage.getItem('zobra_token'))
    : false;
  const isAdminOrStaff = !!user && user.role !== 'CUSTOMER' && hasToken;

  // Quantity/variant state is still validated and submitted with the quote; it just isn't edited here.
  // Pricing is no longer shown in the customizer, so an in-flight estimate must not block Proceed.
  const proceedDisabled =
    submitting || isPreparingPreview || isUploadingArtwork || isUploadingLogo || hasVariantMismatch;
  const hasArtworkOnActiveSide = activeSide === 'front' ? hasFront : hasBack;
  const isUploadBusy = isUploadingLogo || isUploadingArtwork;

  // The single primary action. Rendered in the header on desktop/tablet and the bottom bar on mobile.
  const proceedButton = (fullWidth: boolean) => (
    <button
      id="customizer-proceed-btn"
      type="button"
      onClick={() => handleProceed()}
      disabled={proceedDisabled}
      className={`shrink-0 bg-gradient-to-r from-[#E11D48] to-[#BE185D] hover:from-[#F43F5E] hover:to-[#E11D48] disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none text-white rounded-xl font-semibold shadow-[0_8px_18px_-8px_rgba(225,29,72,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 px-5 text-[15px] ${
        fullWidth ? 'w-full h-11' : 'h-11'
      }`}
    >
      {isUploadBusy || isPreparingPreview || submitting ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{isUploadBusy ? 'Uploading artwork…' : 'Preparing design…'}</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />
          <span>Proceed</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );

  const renderToolContent = (key: ToolKey) => {
    switch (key) {
      case 'logo':
        return (
          <UploadPanel
            side={activeSide}
            isUploading={isUploadBusy}
            hasArtworkOnSide={hasArtworkOnActiveSide}
            fileInputRef={fileInputRef}
            onFileChange={handleFileUpload}
          />
        );
      case 'text':
        return (
          <TextPanel
            value={{
              text: textInput,
              font: textFont,
              size: textFontSize,
              color: textColor,
              bold: textBold,
              italic: textItalic,
              align: textAlign,
            }}
            onChange={handleTextChange}
            onSubmit={selectedText ? () => canvasRef.current?.clearSelection() : handleCreateText}
            addLabel={template.addTextButtonLabel}
            editing={Boolean(selectedText)}
          />
        );
      case 'colors':
        return (
          <ColorPanel
            template={template}
            productColors={productColors}
            productCollarColors={getProductCollarColors(product)}
            selectedColor={selectedColor}
            collarColor={collarColor}
            tapingColor={tapingColor}
            photoPreview={Boolean(getBackdropImage(product, activeSide))}
            photoRecolor={Boolean(getSideRecolor(product, activeSide))}
            showTrimColor={customizerFeatures.trimColor && Boolean(template.secondaryColorLabel)}
            showTapingColor={customizerFeatures.taping}
            onBodyColor={handleColorChange}
            onCollarColor={handleCollarColorChange}
            onTapingColor={setTapingColor}
            brandingMethod={brandingMethod}
            onBrandingMethodChange={setBrandingMethod}
            showBrandingMethod={customizerFeatures.embroidery}
          />
        );
      case 'layers':
        return (
          <SelectionPanel
            selected={selectedCanvasObj}
            onDelete={() => canvasRef.current?.deleteActiveObject()}
            onCenterH={() => canvasRef.current?.centerActiveH()}
            onCenterV={() => canvasRef.current?.centerActiveV()}
            onForward={() => canvasRef.current?.bringForward()}
            onBackward={() => canvasRef.current?.sendBackward()}
          />
        );
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-br from-[#F8F9FC] via-[#EEF1F8] to-[#E2E8F8] text-[#111111] font-sans [&_button]:min-h-0 [&_a]:min-h-0">
      {/* Header: back + product, one Front/Back toggle, one Proceed (desktop/tablet) */}
      <header className="shrink-0 h-14 md:h-16 z-30 bg-gradient-to-r from-white via-white to-[#EEF2FF] border-b border-[#E5E7EB] shadow-[0_1px_0_0_rgba(59,111,235,0.08)] px-2 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-4">
        <Link
          href="/products"
          aria-label="Back to catalog"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0 leading-tight">
          <h1 className="truncate text-sm sm:text-base font-semibold text-[#111111] font-heading">{product.name}</h1>
          <p className="truncate text-xs sm:text-[13px] text-gray-500">Customize your design</p>
        </div>

        {isAdminOrStaff && (
          <span className="hidden xl:inline-flex shrink-0 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[10px] font-bold border border-amber-200">
            Admin Preview
          </span>
        )}

        <div className="shrink-0 flex items-center gap-1 p-1 bg-[#F1F3F7] rounded-xl" data-cy="customizer-side-switcher">
          {sides.map((side) => {
            const placed = side === 'front' ? hasFront : hasBack;
            return (
              <button
                key={side}
                id={`btn-switch-${side}`}
                type="button"
                aria-pressed={activeSide === side}
                onClick={() => handleSwitchSide(side)}
                className={`relative flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg text-sm font-medium transition-all ${
                  activeSide === side
                    ? 'bg-white text-[#111111] shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {/* Visual color indicator showing currently selected body and collar/trim colors */}
                <span className="flex items-center -space-x-1 shrink-0" data-cy={`switcher-color-indicator-${side}`}>
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: hexOf(selectedColor) }}
                    title={`Body: ${selectedColor}`}
                  />
                  {customizerFeatures.trimColor && Boolean(template.secondaryColorLabel) && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: hexOf(collarColor) }}
                      title={`Collar: ${collarColor}`}
                    />
                  )}
                </span>
                <span>{side === 'front' ? 'Front' : 'Back'}</span>
                {placed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0" aria-label="has design" />
                )}
              </button>
            );
          })}
        </div>

        {isDesktop && proceedButton(false)}
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Desktop/tablet tool panel: Colors / Logo / Text tabs, then the active tool's content */}
        {isDesktop && (
          <aside className="shrink-0 w-[260px] lg:w-[320px] min-h-0 flex flex-col bg-white border-r border-[#E5E7EB]">
            <div className="shrink-0 border-b border-[#F1F3F7]">
              <ToolRail
                active={activeToolTab}
                onSelect={handleToolSelect}
                hasSelection={!!selectedCanvasObj}
                tools={PANEL_TOOLS}
                variant="panel"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              {PANEL_SECTION_TITLES[activeToolTab] && (
                <h2 className={`${PANEL_HEADING} mb-3`}>
                  {activeToolTab === 'text' && selectedText ? 'Edit text' : PANEL_SECTION_TITLES[activeToolTab]}
                </h2>
              )}
              {renderToolContent(activeToolTab)}

              {selectedCanvasObj && (
                <section className="mt-5 pt-4 border-t border-[#F1F3F7]">
                  <h2 className={`${PANEL_HEADING} mb-3`}>{TOOL_TITLES.layers}</h2>
                  {renderToolContent('layers')}
                </section>
              )}
            </div>
          </aside>
        )}

        {/* Canvas stage */}
        <div className="relative flex-1 min-w-0 min-h-0 p-2 md:p-6 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.95),rgba(255,255,255,0)_65%)]">
          {(draftRestoredNotice || submitError) && (
            <div className="absolute top-2 inset-x-2 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
              {draftRestoredNotice && (
                <div className="pointer-events-auto max-w-md w-full bg-[#EEF2FF] border border-[#D9E2FF] text-[#1E40AF] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#3B6FEB] shrink-0" />
                  <span>Restored your saved design draft from previous session.</span>
                </div>
              )}
              {submitError && (
                <div role="alert" className="pointer-events-auto max-w-md w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span className="flex-1">{submitError}</span>
                  <button type="button" onClick={() => setSubmitError(null)} aria-label="Dismiss error" className="shrink-0 text-red-400 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <StageScaler baseWidth={STAGE_WIDTH} baseHeight={STAGE_HEIGHT} maxScale={1.35}>
            <CustomizerCanvas
              ref={canvasRef}
              selectedColor={hexOf(selectedColor)}
              collarColor={hexOf(collarColor)}
              category={product?.category?.slug || product?.category?.name || (isCap ? 'caps' : 't-shirts')}
              template={template}
              product={product}
              backEnabled={backEnabled}
              activeSide={activeSide}
              onSideChange={setActiveSide}
              onSelectionChange={handleSelectionChange}
              onDesignChange={({ hasFront: hf, hasBack: hb }: { hasFront: boolean; hasBack: boolean }) => {
                setHasFront(hf);
                setHasBack(hb);
              }}
              onUploadStatusChange={({ isUploading, error }) => {
                setIsUploadingArtwork(isUploading);
                if (error) setSubmitError(error);
              }}
              initialFrontJson={restoredDraft?.frontCanvasJson}
              initialBackJson={restoredDraft?.backCanvasJson}
              initialArtworkUrl={restoredDraft?.originalArtworkUrl}
            />
          </StageScaler>
        </div>

      </div>

      {/* Mobile: docked tool sheet, the single Proceed action, compact tool navigation */}
      {!isDesktop && (
        <div className="shrink-0 bg-white">
          <BottomSheet
            open={mobileSheet !== null}
            title={mobileSheet ? TOOL_TITLES[mobileSheet] : ''}
            onClose={() => setMobileSheet(null)}
          >
            {mobileSheet ? renderToolContent(mobileSheet) : null}
          </BottomSheet>

          <div className="px-3 py-2 border-t border-[#E5E7EB]">{proceedButton(true)}</div>

          <div className="border-t border-[#E5E7EB] pb-[env(safe-area-inset-bottom)]">
            <ToolRail
              active={mobileSheet}
              onSelect={handleToolSelect}
              hasSelection={!!selectedCanvasObj}
              tools={MOBILE_TOOLS}
              variant="bar"
            />
          </div>
        </div>
      )}

      {/* Checkout step (guests verify their number on "Request quote") */}
      {showReview && (
        <OrderReviewSheet
          product={product}
          selectedColor={selectedColor}
          colorHex={hexOf(selectedColor)}
          printType={resolvedPrintType}
          quantity={quantity}
          variants={variants}
          onOrderChange={(qty, vars) => {
            setQuantity(qty);
            setVariants(vars);
          }}
          addonSelected={addonSelected}
          onAddonChange={setAddonSelected}
          pricingState={pricingState}
          submitting={submitting || isPreparingPreview}
          error={submitError}
          collarColor={collarColor}
          collarColorHex={hexOf(collarColor)}
          showCollarColor={customizerFeatures.trimColor && Boolean(template.secondaryColorLabel)}
          tapingColor={tapingColor}
          tapingColorHex={hexOf(tapingColor)}
          showTapingColor={customizerFeatures.taping}
          brandingMethod={customizerFeatures.embroidery ? brandingMethod : 'Print'}
          showBrandingMethod={customizerFeatures.embroidery}
          onConfirm={() => handleProceed(true)}
          onClose={() => {
            if (!submitting) setShowReview(false);
          }}
        />
      )}

      {/* Guest → WhatsApp OTP verification (customers only; no email/password, no role choice) */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setShowAuthModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="customizer-auth-title"
        >
          <div
            id="customizer-auth-modal"
            className="bg-white w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-2xl border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#3B6FEB]/10 rounded-xl flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-[#3B6FEB]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="customizer-auth-title" className="text-base font-black text-[#111111] font-heading">
                  Verify your mobile number to continue
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Your design is saved. Log in or sign up with a WhatsApp OTP to place your order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close and keep editing"
                className="p-1 text-gray-400 hover:text-[#111111] shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Design preview chip */}
            <div className="bg-[#F8F9FC] rounded-xl p-2.5 flex items-center gap-2.5 border border-[#E5E7EB]">
              <div className="w-7 h-7 rounded-lg bg-[#3B6FEB]/10 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[#3B6FEB]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#111111] truncate">{product?.name}</p>
                <p className="text-[10px] text-gray-500">{selectedColor} · {resolvedPrintType}</p>
              </div>
            </div>

            {authNotice && (
              <p role="alert" data-cy="customizer-auth-notice" className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {authNotice}
              </p>
            )}

            <WhatsAppOtpLogin onSuccess={handleOtpVerified} verifyLabel="Verify & Continue" />

            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 transition-colors py-0.5"
            >
              Keep editing my design
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomizePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm font-bold text-gray-500">Loading Studio...</div>}>
      <CustomizeProductContent productId={params.id} />
    </Suspense>
  );
}
