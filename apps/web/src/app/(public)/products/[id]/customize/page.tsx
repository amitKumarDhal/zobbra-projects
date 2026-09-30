'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ChevronRight,
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
import { applyMainColorToVariants } from '@/lib/customizerVariants';
import type { CustomizerCanvasRef, CustomizerCanvasProps } from '@/components/customizer/CustomizerCanvas';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getColorHex, isLightColor } from '@/components/customizer/GarmentBackdrop';
import { StageScaler } from '@/components/customizer/StageScaler';
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

  const { user } = useCustomerUser();

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
  // Default text color contrasts with the product color unless the customer picked one.
  const textColor = textColorPick ?? (isLightColor(getColorHex(selectedColor)) ? '#111111' : '#FFFFFF');

  // Selected canvas object inspector
  const [selectedCanvasObj, setSelectedCanvasObj] = useState<any>(null);

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

  // Guest → Login/Register modal (replaces direct redirect)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Live Server Pricing State. Still computed (pricing-preview), but no longer displayed in the customizer.
  const [, setPricingState] = useState<PricingState>({ status: 'idle' });

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

        // Derive initial colors and MOQ
        const moq = prod.bulkPricing?.[0]?.minQuantity || 50;
        setQuantity(moq);

        const initialTemplate = getCustomizerTemplate(prod);
        const defaultColor = prod.variants?.[0]?.color || (
          initialTemplate.type === 'cap' || initialTemplate.type === 'bag' ? 'Charcoal Black' : 'White'
        );
        const defaultCollar = initialTemplate.type === 'cap' || initialTemplate.type === 'bag' 
          ? 'Charcoal Black' 
          : initialTemplate.type === 'mug' 
          ? 'White' 
          : 'Yellow';
        const defaultSize = initialTemplate.requiresSize === false ? 'Free Size' : 'L';

        // ONLY restore draft if user is resuming from login/register flow
        if (isResume) {
          const savedDraft = getCustomizerDraft(prod.id);
          if (savedDraft) {
            setRestoredDraft(savedDraft);
            setSelectedColor(savedDraft.selectedColor || defaultColor);
            if (savedDraft.collarColor) setCollarColor(savedDraft.collarColor);
            else setCollarColor(defaultCollar);
            if (savedDraft.quantity) setQuantity(savedDraft.quantity);
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
            setVariants([{ color: defaultColor, size: defaultSize, quantity: moq }]);
          }
        } else {
          // Fresh, clean start matching design studio reference
          setSelectedColor(defaultColor);
          setCollarColor(defaultCollar);
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

  // Handle body color change: updates the garment silhouette. Only the untouched default variant row
  // follows the main color; rows the customer configured keep their own colors.
  const handleColorChange = (col: string) => {
    setVariants(prev => applyMainColorToVariants(prev, selectedColor, col));
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

  // Resolve customizer template for current product
  const template = getCustomizerTemplate(product);
  const isCap = template.type === 'cap';

  // Determine active print positions
  const resolvedPrintType = hasFront && hasBack 
    ? 'Front & Back' 
    : hasBack 
    ? 'Back Only' 
    : 'Front Only';

  // Variant quantity sum validation
  const variantSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  const hasVariantMismatch = variants.length > 0 && variantSum !== quantity;

  // Live Server Pricing via POST /api/v1/quotes/pricing-preview with client-side guest fallback
  const fetchPricing = useCallback(
    debounce(async (pid: string, qty: number, pt: string, vars: VariantData[], prodObj: any) => {
      if (!pid || qty <= 0) {
        setPricingState({ status: 'idle' });
        return;
      }

      // Variant quantity sum must equal total quantity
      if (vars.length > 0) {
        const sum = vars.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
        if (sum !== qty) {
          // Invalid: no pricing request!
          setPricingState({ status: 'idle' });
          return;
        }
      }

      setPricingState({ status: 'loading' });

      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
            : null;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const body: { productId: string; quantity: number; printType: string; variants?: VariantData[] } = {
          productId: pid,
          quantity: qty,
          printType: pt || 'Front Only',
        };
        if (vars.length > 0) body.variants = vars;

        const res = await fetch(`${API_URL}/quotes/pricing-preview`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setPricingState({ status: 'success', data: data.data });
        } else {
          // If token was missing/unauthorized or API refused guest preview, calculate client-side estimate for guest
          if (!token || res.status === 401 || data.message?.toLowerCase().includes('token') || data.message?.toLowerCase().includes('auth')) {
            const bulkTiers = prodObj?.bulkPricing || [];
            let unitPrice = prodObj?.basePrice || 250;
            if (Array.isArray(bulkTiers) && bulkTiers.length > 0) {
              const sorted = [...bulkTiers].sort((a, b) => b.minQuantity - a.minQuantity);
              const matched = sorted.find((t: any) => qty >= t.minQuantity);
              if (matched && matched.price) unitPrice = matched.price;
              else if (sorted[sorted.length - 1]?.price) unitPrice = sorted[sorted.length - 1].price;
            }
            const subtotal = unitPrice * qty;
            const gstRate = prodObj?.gstRate ?? 18;
            const gstTotal = Math.round(subtotal * (gstRate / 100));
            const totalAmount = subtotal + gstTotal;
            setPricingState({
              status: 'success',
              data: {
                productId: pid,
                productName: prodObj?.name || 'Product',
                unitPrice,
                subtotal,
                discount: 0,
                gstRate,
                gstTotal,
                totalAmount,
              },
            });
          } else {
            setPricingState({
              status: 'error',
              message: data.message || 'Unable to calculate estimate. Please try again.',
            });
          }
        }
      } catch {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
            : null;
        if (!token) {
          const bulkTiers = prodObj?.bulkPricing || [];
          let unitPrice = prodObj?.basePrice || 250;
          if (Array.isArray(bulkTiers) && bulkTiers.length > 0) {
            const sorted = [...bulkTiers].sort((a, b) => b.minQuantity - a.minQuantity);
            const matched = sorted.find((t: any) => qty >= t.minQuantity);
            if (matched && matched.price) unitPrice = matched.price;
          }
          const subtotal = unitPrice * qty;
          const gstRate = prodObj?.gstRate ?? 18;
          const gstTotal = Math.round(subtotal * (gstRate / 100));
          const totalAmount = subtotal + gstTotal;
          setPricingState({
            status: 'success',
            data: {
              productId: pid,
              productName: prodObj?.name || 'Product',
              unitPrice,
              subtotal,
              discount: 0,
              gstRate,
              gstTotal,
              totalAmount,
            },
          });
        } else {
          setPricingState({
            status: 'error',
            message: 'Network error calculating pricing preview.',
          });
        }
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (product?.id && quantity > 0) {
      const varsToSend = variants.length > 0
        ? variants
        : [{ color: selectedColor, size: isCap ? 'Free Size' : 'L', quantity }];
      fetchPricing(product.id, quantity, resolvedPrintType, varsToSend, product);
    }
  }, [product, quantity, resolvedPrintType, variants, selectedColor, isCap, fetchPricing]);

  // Handle Side Switcher. The canvas owns the switch and reports the side it actually moved to via
  // onSideChange, so the toggle never runs ahead of a switch that is still loading (or deferred).
  const handleSwitchSide = (side: 'front' | 'back') => {
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

  const handleTextChange = (patch: Partial<TextValue>) => {
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

  // The Primary "PROCEED" Submission Handler
  const handleProceed = async () => {
    setSubmitError(null);

    // Validate variant breakdown sum
    const vSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    if (variants.length > 0 && vSum !== quantity) {
      setSubmitError(`Total variant quantity (${vSum}) must equal total order quantity (${quantity}).`);
      return;
    }

    const finalVariants = variants.length > 0
      ? variants
      : [{ color: selectedColor, size: isCap ? 'Free Size' : 'L', quantity }];

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

      const isCustomer = user && user.role === 'CUSTOMER';
      const effectiveArtworkUrl = (originalArtwork && !originalArtwork.startsWith('data:image/'))
        ? originalArtwork
        : (previews.frontCloudinaryUrl || previews.backCloudinaryUrl || undefined);

      // Guest: Save draft to localStorage then show Login/Register modal
      if (!token || !isCustomer) {
        const draftId = `draft_${Date.now()}`;
        const draftData: CustomizerDraft = {
          draftId,
          productId: product.id,
          productName: product.name,
          selectedColor,
          collarColor,
          frontCanvasJson: previews.frontCanvasJson,
          backCanvasJson: previews.backCanvasJson,
          previewFrontUrl: previews.frontCloudinaryUrl,
          previewBackUrl: previews.backCloudinaryUrl,
          originalArtworkUrl: effectiveArtworkUrl,
          quantity,
          printPosition: resolvedPrintType,
          variants: finalVariants,
          timestamp: Date.now(),
        };

        saveCustomizerDraft(draftData);
        setSubmitting(false);
        setShowAuthModal(true);
        return;
      }

      // Logged-in Customer: Submit official Quote
      const quotePayload = {
        productId: product.id,
        quantity,
        color: selectedColor,
        printingType: 'Custom Online Design',
        printPosition: resolvedPrintType,
        printType: resolvedPrintType,
        // Cloudinary CDN URLs only, never base64 data URLs
        artworkUrl: effectiveArtworkUrl,
        previewFrontUrl: previews.frontCloudinaryUrl || undefined,
        previewBackUrl: previews.backCloudinaryUrl || undefined,
        // Fabric canvas state snapshot (sanitized, zero base64)
        canvasStateJson: JSON.stringify({
          front: previews.frontCanvasJson,
          back: previews.backCanvasJson,
        }),
        // Compact metadata only — NO duplicate base64 or preview strings!
        customizationRequirements: JSON.stringify({
          selectedColor,
          collarColor,
          printPosition: resolvedPrintType,
          hasFront: previews.hasFront,
          hasBack: previews.hasBack,
          variants: finalVariants,
        }),
        items: [
          {
            productId: product.id,
            printType: resolvedPrintType,
            color: selectedColor,
            collarColor,
            size: finalVariants[0]?.size || (template.requiresSize === false ? 'Free Size' : 'L'),
            quantity,
            variants: finalVariants,
          },
        ],
        notes: isCap 
          ? `Custom Online Cap Design - ${resolvedPrintType} on ${selectedColor} (Visor: ${collarColor})`
          : `Custom Online Design - ${resolvedPrintType} on ${selectedColor} (${template.secondaryColorLabel || 'Secondary'}: ${collarColor})`,
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
      onClick={handleProceed}
      disabled={proceedDisabled}
      className={`shrink-0 bg-[#3B6FEB] hover:bg-[#2F5FD6] disabled:bg-gray-400 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 px-5 text-[15px] ${
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
            onSubmit={handleCreateText}
            addLabel={template.addTextButtonLabel}
          />
        );
      case 'colors':
        return (
          <ColorPanel
            template={template}
            selectedColor={selectedColor}
            collarColor={collarColor}
            onBodyColor={handleColorChange}
            onCollarColor={handleCollarColorChange}
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
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#EDEEF2] text-[#111111] font-sans [&_button]:min-h-0 [&_a]:min-h-0">
      {/* Header: back + product, one Front/Back toggle, one Proceed (desktop/tablet) */}
      <header className="shrink-0 h-14 md:h-16 z-30 bg-white border-b border-[#E5E7EB] px-2 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-4">
        <Link
          href={`/products/${product.id}`}
          aria-label="Back to product"
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

        <div className="shrink-0 flex items-center gap-0.5 p-1 bg-[#F1F3F7] rounded-xl">
          {(['front', 'back'] as const).map((side) => {
            const placed = side === 'front' ? hasFront : hasBack;
            return (
              <button
                key={side}
                id={`btn-switch-${side}`}
                type="button"
                aria-pressed={activeSide === side}
                onClick={() => handleSwitchSide(side)}
                className={`relative px-3 sm:px-4 h-8 sm:h-9 rounded-lg text-sm font-medium transition-all ${
                  activeSide === side ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                {side === 'front' ? 'Front' : 'Back'}
                {placed && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#3B6FEB]" aria-label="has design" />
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
                <h2 className={`${PANEL_HEADING} mb-3`}>{PANEL_SECTION_TITLES[activeToolTab]}</h2>
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
        <div className="relative flex-1 min-w-0 min-h-0 p-2 md:p-6">
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
              selectedColor={selectedColor}
              collarColor={collarColor}
              category={product?.category?.slug || product?.category?.name || (isCap ? 'caps' : 't-shirts')}
              template={template}
              product={product}
              activeSide={activeSide}
              onSideChange={setActiveSide}
              onSelectionChange={setSelectedCanvasObj}
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

      {/* Guest → Login / Register Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-10 h-10 bg-[#3B6FEB]/10 rounded-xl flex items-center justify-center mx-auto">
              <UserCheck className="w-5 h-5 text-[#3B6FEB]" />
            </div>

            {/* Copy */}
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#111111] font-heading">Almost There!</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your design has been saved. Create a free account or log in to place your order — you&apos;ll be counted as a regular customer.
              </p>
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

            {/* Auth CTAs */}
            <div className="space-y-2">
              <Link
                href={`/register?returnUrl=${encodeURIComponent(`/products/${product.id}/customize?resume=1`)}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-black text-xs rounded-xl transition-all shadow-sm"
                onClick={() => setShowAuthModal(false)}
              >
                <span>Create Free Account</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/login?returnUrl=${encodeURIComponent(`/products/${product.id}/customize?resume=1`)}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs rounded-xl transition-all"
                onClick={() => setShowAuthModal(false)}
              >
                Log In to My Account
              </Link>
            </div>

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
