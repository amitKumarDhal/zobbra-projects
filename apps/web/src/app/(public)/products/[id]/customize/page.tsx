'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Clock,
  Palette,
  ImagePlus,
  UploadCloud,
  Type,
  Trash2,
  AlignCenter,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  AlignLeft,
  AlignRight,
  UserCheck
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import VariantBreakdownEntry, { VariantData } from '@/components/shared/VariantBreakdownEntry';
import { 
  saveCustomizerDraft, 
  getCustomizerDraft, 
  clearCustomizerDraft, 
  CustomizerDraft 
} from '@/lib/customizerDraft';
import type { CustomizerCanvasRef, CustomizerCanvasProps } from '@/components/customizer/CustomizerCanvas';

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

interface PricingData {
  productId: string;
  productName: string;
  unitPrice: number;
  subtotal: number;
  discount: number;
  gstRate: number;
  gstTotal: number;
  totalAmount: number;
}

type PricingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PricingData }
  | { status: 'error'; message: string };

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

const FONTS = [
  { name: 'Outfit (Modern)', value: 'Outfit' },
  { name: 'Inter (Clean)', value: 'Inter' },
  { name: 'Roboto (Classic)', value: 'Roboto' },
  { name: 'Montserrat (Bold)', value: 'Montserrat' },
  { name: 'JetBrains Mono (Tech)', value: 'JetBrains Mono' },
];

const TEXT_COLORS = [
  '#FFFFFF', '#111111', '#DC2626', '#2563EB', '#16A34A', 
  '#CA8A04', '#7C3AED', '#EA580C', '#EC4899', '#6B7280'
];

const BODY_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Charcoal Black', hex: '#2B2B2B' },
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Orange', hex: '#FF7A00' },
  { name: 'Green', hex: '#00C853' },
  { name: 'Gold', hex: '#E5A100' },
  { name: 'Royal Blue', hex: '#0038FF' },
  { name: 'Purple', hex: '#5B0082' },
  { name: 'Sky Blue', hex: '#29B6F6' },
  { name: 'Hot Pink', hex: '#E91E63' },
  { name: 'Maroon', hex: '#7B1113' },
  { name: 'Lime', hex: '#AEEA00' },
  { name: 'Navy Blue', hex: '#0D1333' },
  { name: 'Heather Grey', hex: '#9E9E9E' },
  { name: 'Bottle Green', hex: '#0B3B24' },
  { name: 'Cream', hex: '#FDF5E6' },
];

const COLLAR_RIB_COLORS = [
  { name: 'Yellow', hex: '#FFD700' },
  { name: 'Charcoal Black', hex: '#2B2B2B' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Orange', hex: '#FF7A00' },
  { name: 'Royal Blue', hex: '#0038FF' },
  { name: 'Purple', hex: '#5B0082' },
  { name: 'Sky Blue', hex: '#29B6F6' },
  { name: 'Hot Pink', hex: '#E91E63' },
  { name: 'Maroon', hex: '#7B1113' },
  { name: 'Green', hex: '#00C853' },
  { name: 'Lime', hex: '#AEEA00' },
  { name: 'Navy Blue', hex: '#0D1333' },
  { name: 'Heather Grey', hex: '#9E9E9E' },
  { name: 'Bottle Green', hex: '#0B3B24' },
];

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
  const [activeToolTab, setActiveToolTab] = useState<'colors' | 'logo' | 'text'>('colors');

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
  const [textFontSize] = useState<number>(24);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textBold, setTextBold] = useState<boolean>(true);
  const [textItalic, setTextItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

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

  // Live Server Pricing State
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
        const res = await fetch(`${API_URL}/products/${productId}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        const prod = data.product || data.data || data;
        setProduct(prod);

        // Derive initial colors and MOQ
        const moq = prod.bulkPricing?.[0]?.minQuantity || 50;
        setQuantity(moq);

        const isCapProduct = Boolean(
          prod.category?.slug === 'caps' ||
          prod.category?.name?.toLowerCase().includes('cap') ||
          prod.name?.toLowerCase().includes('cap') ||
          prod.slug?.includes('cap')
        );

        // ONLY restore draft if user is resuming from login/register flow
        if (isResume) {
          const savedDraft = getCustomizerDraft(prod.id);
          if (savedDraft) {
            setRestoredDraft(savedDraft);
            setSelectedColor(savedDraft.selectedColor || (isCapProduct ? 'Charcoal Black' : 'White'));
            if (savedDraft.collarColor) setCollarColor(savedDraft.collarColor);
            else if (isCapProduct) setCollarColor('Charcoal Black');
            if (savedDraft.quantity) setQuantity(savedDraft.quantity);
            if (savedDraft.variants && savedDraft.variants.length > 0) {
              setVariants(savedDraft.variants);
            } else {
              setVariants([{ color: savedDraft.selectedColor || (isCapProduct ? 'Charcoal Black' : 'White'), size: isCapProduct ? 'Free Size' : 'L', quantity: savedDraft.quantity || moq }]);
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
            if (isCapProduct) {
              setSelectedColor('Charcoal Black');
              setCollarColor('Charcoal Black');
              setVariants([{ color: 'Charcoal Black', size: 'Free Size', quantity: moq }]);
            } else {
              setSelectedColor('White');
              setCollarColor('Yellow');
              setVariants([{ color: 'White', size: 'L', quantity: moq }]);
            }
          }
        } else {
          // Fresh, clean start matching design studio reference
          if (isCapProduct) {
            setSelectedColor('Charcoal Black');
            setCollarColor('Charcoal Black');
            setVariants([{ color: 'Charcoal Black', size: 'Free Size', quantity: moq }]);
          } else {
            setSelectedColor('White');
            setCollarColor('Yellow');
            setVariants([{ color: 'White', size: 'L', quantity: moq }]);
          }
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

  // Handle body color change: updates garment body silhouette and synchronizes variants
  const handleColorChange = (col: string) => {
    setSelectedColor(col);
    if (variants.length > 0) {
      setVariants(prev => prev.map(v => ({ ...v, color: col })));
    }
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

  // Check if current product belongs to Cap / Headwear category
  const isCap = Boolean(
    product?.category?.slug === 'caps' ||
    product?.category?.name?.toLowerCase().includes('cap') ||
    product?.name?.toLowerCase().includes('cap') ||
    product?.slug?.includes('cap')
  );

  // Determine active print positions
  const resolvedPrintType = hasFront && hasBack 
    ? 'Front & Back' 
    : hasBack 
    ? 'Back Only' 
    : 'Front Only';

  // Variant quantity sum validation
  const variantSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  const hasVariantMismatch = variants.length > 0 && variantSum !== quantity;

  // Live Server Pricing via POST /api/v1/quotes/pricing-preview
  const fetchPricing = useCallback(
    debounce(async (pid: string, qty: number, pt: string, vars: VariantData[]) => {
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
          setPricingState({
            status: 'error',
            message: data.message || 'Unable to calculate estimate. Please try again.',
          });
        }
      } catch {
        setPricingState({
          status: 'error',
          message: 'Network error calculating pricing preview.',
        });
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (product?.id && quantity > 0) {
      const varsToSend = variants.length > 0
        ? variants
        : [{ color: selectedColor, size: isCap ? 'Free Size' : 'L', quantity }];
      fetchPricing(product.id, quantity, resolvedPrintType, varsToSend);
    }
  }, [product?.id, quantity, resolvedPrintType, variants, selectedColor, isCap, fetchPricing]);

  const handleQuantityChange = (newQty: number) => {
    const val = Math.max(1, newQty);
    setQuantity(val);
    if (variants.length === 1) {
      setVariants([{ ...variants[0], quantity: val }]);
    }
  };

  // Handle Side Switcher
  const handleSwitchSide = (side: 'front' | 'back') => {
    setActiveSide(side);
    if (canvasRef.current) {
      canvasRef.current.switchSide(side);
    }
  };

  // Add user's custom text to the garment
  const handleCreateText = (e: React.FormEvent) => {
    e.preventDefault();
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
            size: finalVariants[0]?.size || (isCap ? 'Free Size' : 'L'),
            quantity,
            variants: finalVariants,
          },
        ],
        notes: isCap 
          ? `Custom Online Cap Design - ${resolvedPrintType} on ${selectedColor} (Visor: ${collarColor})`
          : `Custom Online Design - ${resolvedPrintType} on ${selectedColor} (Collar & Rib: ${collarColor})`,
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
          <div className="w-10 h-10 border-4 border-[#050505] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-base font-black text-[#050505] uppercase tracking-wider font-heading">Loading Studio...</h2>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-[#050505] font-heading">Product Not Found</h2>
          <p className="text-sm text-gray-600">{productError || 'The requested product could not be loaded.'}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#050505] text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-[#222222] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Identity state determinations
  // Require both a valid cached user AND a token — prevents stale localStorage from showing badge
  const hasToken = typeof window !== 'undefined' 
    ? !!(localStorage.getItem('token') || localStorage.getItem('zobra_token')) 
    : false;
  const isCustomer = !!user && user.role === 'CUSTOMER' && hasToken;
  const isAdminOrStaff = !!user && user.role !== 'CUSTOMER' && hasToken;

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#050505] font-sans pb-16">
      {/* 1. Header Bar: Back, Product Name, Front/Back View, and Auth/Proceed */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          <Link 
            href={`/products/${product.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-black text-[#050505] uppercase tracking-wide truncate">
            {product.name}
          </h1>
        </div>

        {/* Center: Front / Back View Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
          <button
            id="btn-switch-front"
            type="button"
            onClick={() => handleSwitchSide('front')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSide === 'front'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <span>FRONT</span>
            {hasFront && <span className="w-1.5 h-1.5 rounded-full bg-[#3B6FEB]"></span>}
          </button>
          <button
            id="btn-switch-back"
            type="button"
            onClick={() => handleSwitchSide('back')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSide === 'back'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <span>BACK</span>
            {hasBack && <span className="w-1.5 h-1.5 rounded-full bg-[#3B6FEB]"></span>}
          </button>
        </div>

        {/* Right: Actions & Top Proceed */}
        <div className="flex items-center gap-3">
          {isAdminOrStaff && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-bold border border-amber-200">
              <span>Admin Preview</span>
            </div>
          )}

          {!isCustomer && (
            <button
              type="button"
              onClick={() => {
                // Save current state to draft before going to auth
                const returnUrl = `/products/${product.id}/customize?resume=1`;
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('zobbra_auth_return', returnUrl);
                }
                setShowAuthModal(true);
              }}
              className="text-xs font-bold text-gray-600 hover:text-black transition-colors"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={handleProceed}
            disabled={submitting}
            className="px-4 py-2 bg-[#050505] hover:bg-[#222222] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
          >
            {submitting ? 'Saving...' : 'Proceed'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Studio Layout */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {draftRestoredNotice && (
          <div className="bg-[#3B6FEB]/10 border border-[#3B6FEB]/30 text-[#1E40AF] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B6FEB]" />
            <span>Restored your saved design draft from previous session.</span>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: TOOL PANEL (Colors, Logo, Text, Element Inspector) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-6">
            {/* Tool Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
              <button
                id="tab-tool-colors"
                type="button"
                onClick={() => setActiveToolTab('colors')}
                className={`py-2 px-2 text-xs font-bold rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeToolTab === 'colors' 
                    ? 'bg-[#FFF0F5] text-[#E91E63] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette className="w-5 h-5" />
                <span>Colors</span>
              </button>

              <button
                id="tab-tool-logo"
                type="button"
                onClick={() => setActiveToolTab('logo')}
                className={`py-2 px-2 text-xs font-bold rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeToolTab === 'logo' 
                    ? 'bg-[#FFF0F5] text-[#E91E63] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ImagePlus className="w-5 h-5" />
                <span>Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('text')}
                className={`py-2 px-2 text-xs font-bold rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                  activeToolTab === 'text' 
                    ? 'bg-[#FFF0F5] text-[#E91E63] shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Type className="w-5 h-5" />
                <span>Text</span>
              </button>
            </div>

            {/* TAB 1: Garment Color Selector */}
            {activeToolTab === 'colors' && (
              <div className="space-y-6 pt-1">
                {/* BODY / CROWN COLOR Section */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#718096]">
                      {isCap ? 'CROWN COLOR' : 'BODY COLOR'}
                    </h3>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {selectedColor}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-3.5 place-items-center">
                    {BODY_COLORS.map((col) => {
                      const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
                      return (
                        <button
                          key={col.name}
                          type="button"
                          title={col.name}
                          onClick={() => handleColorChange(col.name)}
                          className={`w-9 h-9 rounded-full transition-all duration-150 relative flex items-center justify-center ${
                            isSelected
                              ? 'ring-[3.5px] ring-[#E91E63] ring-offset-2 scale-105 shadow-sm'
                              : 'border border-black/10 shadow-xs hover:scale-110'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          <span className="sr-only">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VISOR / COLLAR & RIB COLOR Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#718096]">
                      {isCap ? 'VISOR / BRIM COLOR' : 'COLLAR & RIB COLOR'}
                    </h3>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {collarColor}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-3.5 place-items-center">
                    {COLLAR_RIB_COLORS.map((col) => {
                      const isSelected = collarColor.toLowerCase() === col.name.toLowerCase();
                      return (
                        <button
                          key={col.name}
                          type="button"
                          title={col.name}
                          onClick={() => handleCollarColorChange(col.name)}
                          className={`w-9 h-9 rounded-full transition-all duration-150 relative flex items-center justify-center ${
                            isSelected
                              ? 'ring-[3.5px] ring-[#E91E63] ring-offset-2 scale-105 shadow-sm'
                              : 'border border-black/10 shadow-xs hover:scale-110'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          <span className="sr-only">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Logo / Artwork Upload Tool */}
            {activeToolTab === 'logo' && (
              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Upload Artwork</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add your logo or artwork to the {activeSide} side.</p>
                </div>

                <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#3B6FEB] bg-[#F8F9FC] hover:bg-blue-50/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#3B6FEB]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#050505]">
                    {(isUploadingLogo || isUploadingArtwork) ? 'Uploading artwork…' : 'Click or Drag Logo File'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    PNG, JPG, SVG or WebP (Transparent recommended)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleFileUpload}
                    className="sr-only"
                    disabled={isUploadingLogo || isUploadingArtwork}
                  />
                </label>
              </div>
            )}

            {/* TAB 3: Text Tool */}
            {activeToolTab === 'text' && (
              <form onSubmit={handleCreateText} className="space-y-4 pt-1">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">Add Custom Text</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Type your text below and add it to the garment.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Your Text</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter brand or text..."
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-semibold outline-none focus:border-[#3B6FEB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Font Family</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold outline-none focus:border-[#3B6FEB]"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Text Color</label>
                  <div className="flex flex-wrap gap-2">
                    {TEXT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          textColor.toLowerCase() === c.toLowerCase()
                            ? 'ring-2 ring-[#3B6FEB] ring-offset-1 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTextBold(!textBold)}
                      className={`p-1.5 rounded text-xs font-bold transition-all ${textBold ? 'bg-white text-black shadow-xs' : 'text-gray-400'}`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextItalic(!textItalic)}
                      className={`p-1.5 rounded text-xs font-bold transition-all ${textItalic ? 'bg-white text-black shadow-xs' : 'text-gray-400'}`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTextAlign('left')}
                      className={`p-1.5 rounded transition-all ${textAlign === 'left' ? 'bg-white text-black shadow-xs' : 'text-gray-400'}`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('center')}
                      className={`p-1.5 rounded transition-all ${textAlign === 'center' ? 'bg-white text-black shadow-xs' : 'text-gray-400'}`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('right')}
                      className={`p-1.5 rounded transition-all ${textAlign === 'right' ? 'bg-white text-black shadow-xs' : 'text-gray-400'}`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="w-full py-2.5 bg-[#050505] hover:bg-[#222222] disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition-all"
                >
                  + Add Text to {isCap ? 'Cap' : 'Garment'}
                </button>
              </form>
            )}

            {/* Contextual Selection Inspector (Shown when canvas object is active) */}
            {selectedCanvasObj && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
                    Selected Element
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (canvasRef.current) canvasRef.current.deleteActiveObject();
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => canvasRef.current?.centerActiveH()}
                    title="Center Horizontally"
                    className="p-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-gray-700 flex flex-col items-center gap-1"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Center</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canvasRef.current?.centerActiveV()}
                    title="Center Vertically"
                    className="p-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-gray-700 flex flex-col items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Middle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canvasRef.current?.bringForward()}
                    title="Bring Forward"
                    className="p-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-gray-700 flex flex-col items-center gap-1"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Forward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canvasRef.current?.sendBackward()}
                    title="Send Backward"
                    className="p-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-gray-700 flex flex-col items-center gap-1"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Backward</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: LARGE PRODUCT PREVIEW */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3">
            <CustomizerCanvas
              ref={canvasRef}
              selectedColor={selectedColor}
              collarColor={collarColor}
              category={isCap ? 'caps' : 't-shirts'}
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

            <div className="flex items-center justify-between w-full max-w-[540px] px-2 text-xs text-gray-400 font-medium">
              <span>{isCap ? 'Embroidery Area: 10cm × 5.5cm (Front Crown)' : 'Print Area: 30cm × 40cm'}</span>
              <span>Click element to move, scale or rotate</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: ORDER & PRICING PANEL */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-5">
            {/* Product Header */}
            <div className="space-y-1 pb-4 border-b border-[#E5E7EB]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B6FEB]">
                {product.category?.name || (isCap ? 'Custom Headwear' : 'Custom Apparel')}
              </span>
              <h2 className="text-xl font-black text-[#050505] font-heading leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-gray-500 line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Total Quantity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Total Quantity
                </label>
                <span className="text-[11px] font-semibold text-gray-500">
                  MOQ: {product.bulkPricing?.[0]?.minQuantity || 50} pcs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="customizer-quantity-input"
                  type="number"
                  min={product.bulkPricing?.[0]?.minQuantity || 50}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-base font-black text-[#050505] outline-none focus:border-[#3B6FEB]"
                />
                <div className="flex gap-1">
                  {[50, 100, 250, 500].map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleQuantityChange(tier)}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                        quantity === tier 
                          ? 'bg-[#050505] text-white border-[#050505]' 
                          : 'bg-white text-gray-600 border-[#E5E7EB] hover:border-gray-300'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Free Size Badge for Caps */}
            {isCap && (
              <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs">
                <span className="text-base">🧢</span>
                <div>
                  <p className="font-bold text-blue-900">Standard Free Size (One Size Fits All)</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                    Structured 6-panel fit with adjustable rear fabric strap and metal closure.
                  </p>
                </div>
              </div>
            )}

            {/* Variant Matrix Breakdown */}
            <div>
              <VariantBreakdownEntry
                totalQuantity={quantity}
                requiresColor={product.requiresColor !== false}
                requiresSize={!isCap && product.requiresSize !== false}
                variants={variants}
                onChange={setVariants}
              />
            </div>

            {/* Pricing Summary */}
            <div id="customizer-pricing-card" className="bg-[#F8F9FC] rounded-2xl p-4 border border-[#E5E7EB] space-y-2 text-xs">
              {pricingState.status === 'loading' ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-[#3B6FEB] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Calculating estimated pricing…</span>
                </div>
              ) : pricingState.status === 'success' ? (
                <>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Unit Rate ({quantity} pcs)</span>
                    <span className="font-bold text-[#050505]">₹{pricingState.data.unitPrice} / pc</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Body / Collar</span>
                    <span className="font-bold text-[#050505]">{selectedColor} / {collarColor}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Print Location</span>
                    <span className="font-bold text-[#3B6FEB]">{resolvedPrintType}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#050505]">₹{pricingState.data.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>GST ({pricingState.data.gstRate}%)</span>
                    <span className="font-bold text-[#050505]">₹{pricingState.data.gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-baseline">
                    <span className="text-sm font-black text-[#050505] uppercase">Total Estimate</span>
                    <span className="text-xl font-black text-[#050505] font-heading">
                      ₹{pricingState.data.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic text-center pt-1 border-t border-gray-200/60">
                    Estimated price. Final quotation may be adjusted after sales review.
                  </p>
                </>
              ) : hasVariantMismatch ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <p className="font-bold">Variant Mismatch</p>
                  <p className="text-[11px] mt-0.5">
                    Variant quantities sum ({variantSum}) must equal total quantity ({quantity}) to calculate price.
                  </p>
                </div>
              ) : pricingState.status === 'error' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  <p className="font-bold">Pricing Estimate</p>
                  <p className="text-[11px] mt-0.5">{pricingState.message}</p>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500 text-xs">
                  Select quantity and options to calculate estimated price.
                </div>
              )}
            </div>

            {hasVariantMismatch && (
              <p className="text-xs font-semibold text-amber-600">
                Total variant quantity ({variantSum}) must equal order quantity ({quantity}).
              </p>
            )}

            {submitError && (
              <p className="text-xs font-semibold text-red-600">{submitError}</p>
            )}

            {/* Proceed CTA Button */}
            <div className="space-y-2 pt-1">
              <button
                id="customizer-proceed-btn"
                type="button"
                onClick={handleProceed}
                disabled={submitting || isPreparingPreview || isUploadingArtwork || isUploadingLogo || hasVariantMismatch || pricingState.status === 'loading'}
                className="w-full py-4 bg-[#3B6FEB] hover:bg-[#2563EB] disabled:bg-gray-400 text-white rounded-xl text-sm font-black shadow-md transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {(isUploadingArtwork || isUploadingLogo) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading artwork…</span>
                  </>
                ) : (isPreparingPreview || submitting) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Preparing design preview…</span>
                  </>
                ) : isCustomer ? (
                  <>
                    <span>Submit Quote Request</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Proceed &amp; Save Design →</span>
                  </>
                )}
              </button>

              {!isCustomer && (
                <p className="text-center text-[11px] text-gray-400">
                  Create a free account to save and track your order.
                </p>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3B6FEB] mx-auto mb-0.5" />
                <span className="text-[10px] font-bold text-gray-600 block">Digital Proof Included</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[#3B6FEB] mx-auto mb-0.5" />
                <span className="text-[10px] font-bold text-gray-600 block">7-10 Days Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Guest → Login / Register Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-7 space-y-5 shadow-2xl border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-[#3B6FEB]/10 rounded-2xl flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6 text-[#3B6FEB]" />
            </div>

            {/* Copy */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#050505] font-heading">Almost There!</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your design has been saved. Create a free account or log in to place your order — you&apos;ll be counted as a regular customer.
              </p>
            </div>

            {/* Design preview chip */}
            <div className="bg-[#F8F9FC] rounded-xl p-3 flex items-center gap-3 border border-[#E5E7EB]">
              <div className="w-8 h-8 rounded-lg bg-[#3B6FEB]/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#3B6FEB]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#050505] truncate">{product?.name}</p>
                <p className="text-[11px] text-gray-500">{selectedColor} · {quantity} pcs · {resolvedPrintType}</p>
              </div>
            </div>

            {/* Auth CTAs */}
            <div className="space-y-2.5">
              <Link
                href={`/register?returnUrl=${encodeURIComponent(`/products/${product.id}/customize?resume=1`)}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-black text-sm rounded-xl transition-all shadow-md"
                onClick={() => setShowAuthModal(false)}
              >
                <span>Create Free Account</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/login?returnUrl=${encodeURIComponent(`/products/${product.id}/customize?resume=1`)}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#050505] hover:bg-[#222222] text-white font-bold text-sm rounded-xl transition-all"
                onClick={() => setShowAuthModal(false)}
              >
                Log In to My Account
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
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
