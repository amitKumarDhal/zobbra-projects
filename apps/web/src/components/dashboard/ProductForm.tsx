'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Sparkles,
  UploadCloud,
  X,
  Trash2,
  Check,
  AlertCircle,
  Package,
  IndianRupee,
  Star,
  Lock,
  Settings2,
  Ruler,
  Palette,
  Image as ImageIcon,
  Brush,
  Camera,
  Video,
  Gift,
  BadgePlus,
  ListChecks,
  GripVertical,
  Plus,
  Layers,
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { getColorHex } from '@/lib/colors';
import { getVideoPoster } from '@/lib/productConfig';
import {
  CustomizerViewsEditor,
  EMPTY_VIEWS,
  pruneViews,
  viewsFromProduct,
  viewsPayload,
  type CustomizerViewsForm,
} from './CustomizerViewsEditor';
import {
  listReusableTemplates,
  getReusableTemplateById,
  getTemplateCapabilities,
} from '@/lib/customizerTemplates';

const MAX_IMAGES = 6;
const MAX_ORDER_IMAGES = 12;
const MAX_VIDEOS = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const CAP_DESCRIPTION_TEMPLATE = `Premium 6-panel structured baseball cap crafted from 100% heavy brushed cotton twill.

### Key Features & Specifications:
- **Fabric**: 100% Heavy Brushed Compact Cotton Twill for enhanced durability and superior crown shape retention.
- **Structure**: 6-Panel structured design with fused hard buckram interior support preventing collapse.
- **Visor**: Pre-curved visor with 6 rows of contrast/tonal edge stitching.
- **Ventilation**: 6 sewn embroidered eyelets (one per panel) ensuring breathability in all seasons.
- **Sweatband**: Cotton twill interior moisture-wicking sweatband for all-day comfort.
- **Closure**: Adjustable brass metal slide buckle with hidden grommet tuck-in (Free Size / Fits 54cm–60cm circumference).
- **Branding Methods**: Engineered specifically for 3D Puff Embroidery, Flat Embroidery, Woven Badges, and HD DTF Transfer.
- **MOQ**: 20 Pieces. Ideal for corporate merchandise, trade shows, delivery teams, and promotional events.`;

const POLO_DESCRIPTION_TEMPLATE = `Elevate your corporate identity with our Premium Custom Corporate Pique Polo T-Shirt.

### Key Features & Specifications:
- **Fabric**: 220–240 GSM heavy-duty 100% Combed Compact Cotton Pique knit fabric. Bio-washed and silicon-softened for a smooth, lint-free surface.
- **Tailoring**: Structured 3-button placket with color-matched pearlized buttons. Reinforced collar with fused interlining and ribbed sleeve cuffs.
- **Custom Branding Ready**: Precision customization on Left Chest, Right Chest, Both Sleeves, and Full Back.
- **Print Methods**: High-Definition Embroidery, Screen Printing, and HD Digital DTF transfers.
- **MOQ**: 20 Pieces. Individually polybagged.`;

const BAG_DESCRIPTION_TEMPLATE = `Executive 28L corporate laptop backpack engineered with high-density water-resistant ballistic polyester, dual reinforced compartments, and a dedicated 15.6" padded laptop sleeve.

### Key Features & Specifications:
- **Material**: 900D Heavy-Duty Water-Repellent Ballistic Polyester with scratch-resistant coating.
- **Laptop Protection**: Dedicated shock-absorbing padded sleeve accommodates up to 15.6-inch laptops and tablets.
- **Capacity & Compartments**: 28-Litre capacity featuring 2 large zippered main compartments, 1 quick-access front zippered organizer, and 1 side elastic mesh water bottle holder.
- **Ergonomics**: Contoured multi-panel airflow back padding with breathable mesh and adjustable padded shoulder straps for maximum lumbar support.
- **Hardware & Finish**: Heavy-duty dual metal zippers with corded pullers, reinforced top padded grab handle, and subtle cyan-blue contrast piping.
- **Branding Methods**: Tailored for High-Density Embroidery, Rubberized 3D Badges, Silk Screen Printing, and HD DTF Transfer on the front corporate branding zone (12cm × 8cm).
- **MOQ**: 20 Pieces. Ideal for new hire welcome kits, corporate gifting, tech conferences, and executive teams.`;

const MUG_DESCRIPTION_TEMPLATE = `Premium 330ml (11oz) matte-finish ceramic coffee mug engineered for corporate gifting, welcome kits, and daily office use.

### Key Features & Specifications:
- **Material**: Premium Grade-A Ceramic Stoneware with chip-resistant rim and durable glaze.
- **Capacity**: 330 ml / 11 oz. Ergonomic C-shaped comfort handle.
- **Finish**: Modern ultra-smooth matte exterior with food-grade non-porous interior.
- **Safety Standards**: 100% Lead-Free, Cadmium-Free, Microwave Safe & Dishwasher Safe.
- **Branding Methods**: High-precision Screen Printing, UV DTF Wrap, Sublimation Printing, and Metallic Gold/Silver Foil stamping on dual-sided branding areas (7cm × 7cm per side or full wrap 20cm × 8cm).
- **Packaging**: Individually packed in protective thermocol bubble-wrap and corrugated Kraft gift box.
- **MOQ**: 25 Pieces. Ideal for employee onboarding kits, client appreciation, executive desk accessories, and corporate events.`;

type PresetKey = 'CAP' | 'POLO' | 'BAG' | 'MUG';
type OrderMode = 'SINGLE' | 'BULK' | 'BOTH';

interface ColorRow {
  name: string;
  hex: string;
}
interface RangeRow {
  minQuantity: number | '';
  maxQuantity: number | '';
  pricePerUnit: number | '';
  printType?: string;
}
interface MediaRow {
  url: string;
  rating: number | null;
  keyword?: string;
  review?: string;
  description?: string;
  title?: string;
}
interface StockPoolRow {
  stockType: string;
  colors: string[];
  stock: number | '';
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  basePrice: number | '';
  minOrderQty: number | '';
  stockCount: number | '';
  minSampleQty: number | '';
  rating: number | '';
  reviewCount: number | '';
  ranges: RangeRow[];
  stockEnabled: boolean;
  stockPools: StockPoolRow[];
  orderMode: OrderMode;
  categoryId: string;
  customizationEnabled: boolean;
  customizerTemplateId: string;
  trimColorEnabled: boolean;
  tapingColorEnabled: boolean;
  backDesignEnabled: boolean;
  embroideryEnabled: boolean;
  zipperEnabled: boolean;
  isActive: boolean;
  requiresSize: boolean;
  sizes: string[];
  colors: ColorRow[];
  images: string[];
  /** Which product images the customizer shows as the front and back. */
  views: CustomizerViewsForm;
  designerEnabled: boolean;
  orderImages: MediaRow[];
  videos: MediaRow[];
  giftEnabled: boolean;
  giftTitle: string;
  giftDescription: string;
  giftMinQuantity: number | '';
  addonEnabled: boolean;
  addonTitle: string;
  addonDescription: string;
  addonPrice: number | '';
  addonPriceType: 'PER_ORDER' | 'PER_PIECE';
  highlights: string[];
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  basePrice: '',
  minOrderQty: '',
  stockCount: '',
  minSampleQty: '',
  rating: '',
  reviewCount: '',
  ranges: [],
  stockEnabled: false,
  stockPools: [],
  orderMode: 'BOTH',
  categoryId: '',
  customizationEnabled: true,
  customizerTemplateId: '',
  trimColorEnabled: true,
  tapingColorEnabled: false,
  backDesignEnabled: true,
  embroideryEnabled: false,
  zipperEnabled: false,
  isActive: true,
  requiresSize: true,
  sizes: [],
  colors: [],
  images: [],
  views: EMPTY_VIEWS,
  designerEnabled: true,
  orderImages: [],
  videos: [],
  giftEnabled: false,
  giftTitle: '',
  giftDescription: '',
  giftMinQuantity: '',
  addonEnabled: false,
  addonTitle: '',
  addonDescription: '',
  addonPrice: '',
  addonPriceType: 'PER_ORDER',
  highlights: [],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const numberOrBlank = (value: string): number | '' => (value === '' ? '' : Number(value));
const colorRows = (names: string[]): ColorRow[] => names.map((name) => ({ name, hex: getColorHex(name).toUpperCase() }));
const rangeRows = (rows: Array<[number, number | '', number]>, printType: string): RangeRow[] =>
  rows.map(([minQuantity, maxQuantity, pricePerUnit]) => ({ minQuantity, maxQuantity, pricePerUnit, printType }));

const PRESETS: Record<PresetKey, { categoryMatch: (c: any) => boolean; values: Partial<FormState> }> = {
  MUG: {
    categoryMatch: (c) => c.slug === 'drinkware' || /mug|bottle|drink/i.test(c.name || ''),
    values: {
      name: 'Classic Corporate Ceramic Coffee Mug',
      slug: 'classic-corporate-ceramic-mug',
      basePrice: 149,
      minOrderQty: 25,
      description: MUG_DESCRIPTION_TEMPLATE,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790086438/products/corporate-ceramic-coffee-mug-black.jpg',
        '/images/products/corporate-ceramic-mug.jpg',
      ],
      requiresSize: false,
      sizes: [],
      colors: colorRows(['Matte Black', 'Classic White', 'Navy Blue']),
      ranges: rangeRows([[25, 49, 149], [50, 99, 129], [100, 249, 109], [250, 499, 95], [500, '', 79]], 'Screen Print / UV DTF'),
    },
  },
  CAP: {
    categoryMatch: (c) => c.slug === 'caps' || /cap/i.test(c.name || ''),
    values: {
      name: 'Classic Promotional Structured Cotton Cap',
      slug: 'classic-promotional-cotton-cap',
      basePrice: 149,
      minOrderQty: 20,
      description: CAP_DESCRIPTION_TEMPLATE,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790083669/products/classic-cotton-cap-black.jpg',
        '/images/products/classic-cotton-cap.jpg',
      ],
      requiresSize: false,
      sizes: [],
      colors: colorRows(['Charcoal Black', 'Navy Blue', 'Classic White', 'Royal Blue', 'Crimson Red']),
      ranges: rangeRows([[20, 49, 149], [50, 99, 129], [100, 249, 109], [250, 499, 95], [500, '', 85]], 'Front 3D Embroidery'),
    },
  },
  POLO: {
    categoryMatch: (c) => c.slug === 't-shirts' || /t-shirt/i.test(c.name || ''),
    values: {
      name: 'Classic Corporate Pique Polo T-Shirt',
      slug: 'classic-corporate-polo-tshirt',
      basePrice: 299,
      minOrderQty: 20,
      description: POLO_DESCRIPTION_TEMPLATE,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790080446/products/custom-corporate-polo-black.jpg',
        '/images/products/classic-black-polo.jpg',
      ],
      requiresSize: true,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: colorRows(['Charcoal Black', 'Navy Blue']),
      ranges: rangeRows([[20, 49, 299], [50, 99, 279], [100, '', 259]], 'Front Only'),
    },
  },
  BAG: {
    categoryMatch: (c) => c.slug === 'bags' || /bag/i.test(c.name || ''),
    values: {
      name: 'Executive Corporate Laptop Backpack',
      slug: 'executive-corporate-laptop-backpack',
      basePrice: 699,
      minOrderQty: 20,
      description: BAG_DESCRIPTION_TEMPLATE,
      images: [
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790085384/products/executive-corporate-backpack-black.jpg',
        '/images/products/executive-laptop-backpack.jpg',
      ],
      requiresSize: false,
      sizes: [],
      colors: colorRows(['Charcoal Black', 'Navy Blue', 'Heather Grey']),
      ranges: rangeRows([[20, 49, 699], [50, 99, 649], [100, 249, 599], [250, 499, 549], [500, '', 499]], 'Front Logo Print / Embroidery'),
    },
  },
};

/** Maps a stored product (admin API shape) onto the form. */
function formFromProduct(p: any): FormState {
  const colors: ColorRow[] =
    Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors.map((c: any) => ({ name: c.name, hex: (c.hex || getColorHex(c.name)).toUpperCase() }))
      : colorRows(Array.from(new Set<string>((p.variants || []).map((v: any) => v.color).filter(Boolean))));
  const variantSizes = Array.from(new Set<string>((p.variants || []).map((v: any) => v.size).filter(Boolean)));
  const stock = p.stockDeduction || {};
  const gift = p.freeGift || {};
  const addon = p.offerAddon || {};
  return {
    ...EMPTY_FORM,
    name: p.name || '',
    slug: p.slug || '',
    description: p.description || '',
    basePrice: p.basePrice ?? '',
    minOrderQty: p.minOrderQty ?? '',
    stockCount: p.stockCount ?? '',
    minSampleQty: p.minSampleQty ?? '',
    rating: p.ratingOverride ?? '',
    reviewCount: p.reviewCountOverride ?? '',
    ranges: (p.bulkPricing || []).map((t: any) => ({
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity >= 999999 ? '' : t.maxQuantity,
      pricePerUnit: t.pricePerUnit,
      printType: t.printType,
    })),
    stockEnabled: Boolean(stock.enabled),
    stockPools: (stock.pools || []).map((pool: any) => ({ stockType: pool.stockType, colors: pool.colors || [], stock: pool.stock ?? '' })),
    orderMode: ['SINGLE', 'BULK', 'BOTH'].includes(p.orderMode) ? p.orderMode : 'BOTH',
    categoryId: p.categoryId || '',
    customizationEnabled: p.customizationEnabled !== false,
    customizerTemplateId: p.customizerTemplateId || p.customizerTemplate?.id || '',
    trimColorEnabled: p.trimColorEnabled !== false,
    tapingColorEnabled: Boolean(p.tapingColorEnabled),
    backDesignEnabled: p.backDesignEnabled !== false,
    embroideryEnabled: Boolean(p.embroideryEnabled),
    zipperEnabled: Boolean(p.zipperEnabled),
    isActive: p.isActive !== false,
    requiresSize: p.requiresSize !== false,
    sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : p.requiresSize !== false ? variantSizes : [],
    colors,
    images: p.images || [],
    views: viewsFromProduct(p.customizerViews),
    designerEnabled: p.designerEnabled !== false,
    orderImages: Array.isArray(p.orderImages) ? p.orderImages : [],
    videos: Array.isArray(p.videos) ? p.videos : [],
    giftEnabled: Boolean(gift.enabled),
    giftTitle: gift.title || '',
    giftDescription: gift.description || '',
    giftMinQuantity: gift.minQuantity ?? '',
    addonEnabled: Boolean(addon.enabled),
    addonTitle: addon.title || '',
    addonDescription: addon.description || '',
    addonPrice: addon.price ?? '',
    addonPriceType: addon.priceType === 'PER_PIECE' ? 'PER_PIECE' : 'PER_ORDER',
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
  };
}

/** The API payload: every form field is sent, so nothing entered is silently dropped. */
function payloadFromForm(f: FormState) {
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || undefined,
    description: f.description.trim(),
    basePrice: f.basePrice,
    minOrderQty: f.minOrderQty,
    stockCount: f.stockCount,
    minSampleQty: f.minSampleQty,
    rating: f.rating,
    reviewCount: f.reviewCount,
    bulkPricing: f.ranges,
    stockDeduction: { enabled: f.stockEnabled, pools: f.stockPools.filter((p) => p.stockType.trim()) },
    orderMode: f.orderMode,
    categoryId: f.categoryId,
    customizationEnabled: f.customizationEnabled,
    customizerTemplateId: f.customizerTemplateId ? f.customizerTemplateId.trim() : null,
    trimColorEnabled: f.trimColorEnabled,
    tapingColorEnabled: f.tapingColorEnabled,
    backDesignEnabled: f.backDesignEnabled,
    embroideryEnabled: f.embroideryEnabled,
    zipperEnabled: f.zipperEnabled,
    isActive: f.isActive,
    requiresSize: f.requiresSize,
    requiresColor: true,
    sizes: f.requiresSize ? f.sizes : [],
    colors: f.colors.filter((c) => c.name.trim()),
    images: f.images,
    customizerViews: viewsPayload(f.views),
    designerEnabled: f.customizationEnabled,
    orderImages: f.orderImages,
    videos: f.videos,
    freeGift: {
      enabled: f.giftEnabled,
      title: f.giftTitle,
      description: f.giftDescription,
      minQuantity: f.giftMinQuantity,
    },
    offerAddon: {
      enabled: f.addonEnabled,
      title: f.addonTitle,
      description: f.addonDescription,
      price: f.addonPrice,
      priceType: f.addonPriceType,
    },
    highlights: f.highlights.map((h) => h.trim()).filter(Boolean),
  };
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all';
const labelClass = 'block text-xs font-bold text-[#374151] mb-1.5';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Keeps only the non-empty trimmed values, so blank optional fields are not stored. */
function cleanTexts<T extends Record<string, string>>(values: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(values) as Array<keyof T>) {
    const value = values[key].trim();
    if (value) out[key] = value as T[keyof T];
  }
  return out;
}

const smallInput =
  'w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] outline-none focus:border-[#3B6FEB]';

function Section({
  title,
  icon,
  hint,
  badge,
  children,
  id,
}: {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section data-cy={`section-${id}`} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] pb-3">
        <div>
          <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
            {icon} {title}
          </h2>
          {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  cy,
  secondaryCy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  cy: string;
  secondaryCy?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        data-cy={cy}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#3B6FEB]"
      />
      {secondaryCy && (
        <input
          type="checkbox"
          data-cy={secondaryCy}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
      <span>
        <span className="block text-xs font-bold text-[#111111]">{label}</span>
        {description && <span className="block text-[11px] text-gray-500">{description}</span>}
      </span>
    </label>
  );
}

function StarRating({ value, onChange, cy }: { value: number | null; onChange: (next: number | null) => void; cy?: string }) {
  return (
    <div className="flex items-center gap-0.5" data-cy={cy}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(value === star ? null : star)}
          className="p-0.5"
        >
          <Star className={`w-4 h-4 ${value !== null && star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function UploadZone({
  label,
  hint,
  accept,
  disabled,
  uploading,
  onFile,
  cy,
}: {
  label: string;
  hint: string;
  accept: string;
  disabled: boolean;
  uploading: boolean;
  onFile: (file: File) => void;
  cy: string;
}) {
  return (
    <div
      className={`border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 relative transition-all ${
        disabled ? 'opacity-60' : 'hover:border-[#3B6FEB] hover:bg-blue-50/40 cursor-pointer'
      }`}
    >
      <input
        type="file"
        data-cy={cy}
        accept={accept}
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#3B6FEB]">
        <UploadCloud className={`w-5 h-5 ${uploading ? 'animate-bounce' : ''}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-[#111111]">{uploading ? 'Uploading...' : label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | 'image' | 'orderImage' | 'video' | 'mask'>(null);
  const [error, setError] = useState<string | null>(null);

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#111111');
  // Text typed before an upload; it is attached to the next photo / video that is uploaded.
  const [orderImageDraft, setOrderImageDraft] = useState({ keyword: '', review: '', description: '' });
  const [videoTitleDraft, setVideoTitleDraft] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // A removed product image can no longer be the customizer front/back.
  useEffect(() => {
    setForm((prev) => {
      const views = pruneViews(prev.views, prev.images);
      return views === prev.views ? prev : { ...prev, views };
    });
  }, [form.images]);

  // Categories, then (edit mode) the stored product
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/products/categories`);
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
          if (!isEdit) {
            const cap = data.categories.find((c: any) => c.slug === 'caps' || /cap/i.test(c.name || ''));
            const initial = cap || data.categories[0];
            if (initial) setForm((prev) => (prev.categoryId ? prev : { ...prev, categoryId: initial.id }));
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        // Authenticated so inactive products and internal fields are returned for editing.
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/products/${productId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        const product = data.product || data.data;
        if (!res.ok || !product) throw new Error(data.message || 'Product not found');
        if (!cancelled) setForm(formFromProduct(product));
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unable to load product');
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedCat = categories.find((c) => c.id === form.categoryId);
  const isCapCategory = selectedCat?.slug === 'caps' || /cap/i.test(selectedCat?.name || '');
  const isBagCategory = selectedCat?.slug === 'bags' || /bag/i.test(selectedCat?.name || '');
  const isMugCategory = selectedCat?.slug === 'drinkware' || /mug|cup|bottle/i.test(selectedCat?.name || '');
  const presetLabel = isMugCategory ? 'Mug' : isBagCategory ? 'Bag' : isCapCategory ? 'Cap' : 'Polo';
  const presetDescription = isMugCategory
    ? MUG_DESCRIPTION_TEMPLATE
    : isBagCategory
      ? BAG_DESCRIPTION_TEMPLATE
      : isCapCategory
        ? CAP_DESCRIPTION_TEMPLATE
        : POLO_DESCRIPTION_TEMPLATE;

  const selectedTemplate = useMemo(() => getReusableTemplateById(form.customizerTemplateId), [form.customizerTemplateId]);
  const templateCapabilities = useMemo(() => getTemplateCapabilities(selectedTemplate), [selectedTemplate]);

  const colorNames = useMemo(() => form.colors.map((c) => c.name).filter(Boolean), [form.colors]);
  const mappedColors = useMemo(() => {
    const owner = new Map<string, number>();
    form.stockPools.forEach((pool, i) => pool.colors.forEach((c) => owner.set(c.toLowerCase(), i)));
    return owner;
  }, [form.stockPools]);

  const applyPreset = (type: PresetKey) => {
    const preset = PRESETS[type];
    const cat = categories.find(preset.categoryMatch) || categories[0];
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, ...preset.values, categoryId: cat?.id || prev.categoryId }));
  };

  const handleNameChange = (name: string) =>
    setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));

  /* ------------------------------- media --------------------------------- */

  const upload = async (kind: 'image' | 'orderImage' | 'video', file: File) => {
    const isVideo = kind === 'video';
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) return setError(`File is too large. Maximum is ${isVideo ? '100MB' : '5MB'}.`);
    if (isVideo ? !file.type.startsWith('video/') : !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setError(isVideo ? 'Please choose a video file (MP4, MOV or WEBM).' : 'Only JPG, PNG and WEBP images are supported.');
    }
    setError(null);
    setUploading(kind);
    try {
      const url = await uploadToCloudinary(file);
      setForm((prev) =>
        kind === 'image'
          ? { ...prev, images: [...prev.images, url].slice(0, MAX_IMAGES) }
          : kind === 'orderImage'
            ? { ...prev, orderImages: [...prev.orderImages, { url, rating: 5, ...cleanTexts(orderImageDraft) }].slice(0, MAX_ORDER_IMAGES) }
            : { ...prev, videos: [...prev.videos, { url, rating: 5, ...cleanTexts({ title: videoTitleDraft }) }].slice(0, MAX_VIDEOS) }
      );
      if (kind === 'orderImage') setOrderImageDraft({ keyword: '', review: '', description: '' });
      if (kind === 'video') setVideoTitleDraft('');
    } catch (err: any) {
      setError(`Upload failed: ${err?.message || 'please try again'}`);
    } finally {
      setUploading(null);
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)\S+$/i.test(url)) return setError('Enter a valid image URL (https://...).');
    if (form.images.includes(url)) return setError('That image is already added.');
    if (form.images.length >= MAX_IMAGES) return setError(`A product can have up to ${MAX_IMAGES} images.`);
    setError(null);
    set('images', [...form.images, url]);
    setImageUrlInput('');
  };

  const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= items.length || from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  /* ----------------------------- colours/sizes ---------------------------- */

  const addColor = () => {
    const name = colorName.trim();
    if (!name) return;
    if (form.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return setError(`Color "${name}" is already added.`);
    if (!HEX_COLOR.test(colorHex)) return setError('Enter the colour value as a hex code, for example #1F2937.');
    setError(null);
    set('colors', [...form.colors, { name, hex: colorHex.toUpperCase() }]);
    setColorName('');
  };

  const removeColor = (name: string) =>
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.name !== name),
      // A removed colour can no longer be mapped to a stock type
      stockPools: prev.stockPools.map((pool) => ({ ...pool, colors: pool.colors.filter((c) => c !== name) })),
    }));

  const toggleSize = (size: string) =>
    set('sizes', form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : [...form.sizes, size]);

  const addCustomSize = () => {
    const size = customSize.trim();
    if (!size || form.sizes.some((s) => s.toLowerCase() === size.toLowerCase())) return;
    set('sizes', [...form.sizes, size]);
    setCustomSize('');
  };

  /* ------------------------------ stock pools ----------------------------- */

  const updatePool = (index: number, patch: Partial<StockPoolRow>) =>
    set(
      'stockPools',
      form.stockPools.map((pool, i) => (i === index ? { ...pool, ...patch } : pool))
    );

  const togglePoolColor = (index: number, color: string) =>
    set(
      'stockPools',
      form.stockPools.map((pool, i) => {
        if (i === index) {
          return { ...pool, colors: pool.colors.includes(color) ? pool.colors.filter((c) => c !== color) : [...pool.colors, color] };
        }
        // A colour belongs to one stock type only
        return { ...pool, colors: pool.colors.filter((c) => c !== color) };
      })
    );

  /* -------------------------------- submit -------------------------------- */

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Product name is required.';
    if (!form.slug.trim()) return 'Slug (URL) is required.';
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(form.slug.trim().replace(/\s+/g, '-'))) {
      return 'Slug may only contain letters, numbers and hyphens.';
    }
    if (!form.categoryId) return 'Please select a category.';
    if (!form.basePrice || Number(form.basePrice) <= 0) return 'Please enter a valid base price.';
    if (form.rating !== '' && (Number(form.rating) < 0 || Number(form.rating) > 5)) return 'Rating must be between 0 and 5.';
    if (form.requiresSize && form.sizes.length === 0) return 'Select at least one available size, or turn off "Ask customers to select a size".';
    if (form.customizationEnabled) {
      if (!form.customizerTemplateId?.trim()) {
        return 'Select a customizer template before enabling customization.';
      }
      const tmpl = getReusableTemplateById(form.customizerTemplateId);
      if (tmpl) {
        const caps = getTemplateCapabilities(tmpl);
        if (form.trimColorEnabled && !caps.supportsTrimColor) {
          return `The selected template '${tmpl.name}' does not support collar & rib color customization.`;
        }
        if (form.tapingColorEnabled && !caps.supportsTapingColor) {
          return `The selected template '${tmpl.name}' does not support taping color customization.`;
        }
        if (form.backDesignEnabled && !caps.supportsBack) {
          return `The selected template '${tmpl.name}' does not support back design.`;
        }
        if (form.embroideryEnabled && !caps.supportsEmbroidery) {
          return `The selected template '${tmpl.name}' does not support embroidery.`;
        }
        if (form.zipperEnabled && !caps.supportsZipper) {
          return `The selected template '${tmpl.name}' does not support zipper option.`;
        }
      }
    }
    for (const r of form.ranges) {
      if (r.minQuantity === '' || r.pricePerUnit === '' || Number(r.minQuantity) < 1 || Number(r.pricePerUnit) <= 0) {
        return 'Each quantity range needs a Min Qty and a price per piece.';
      }
      if (r.maxQuantity !== '' && Number(r.maxQuantity) < Number(r.minQuantity)) return 'A range\'s Max Qty cannot be below its Min Qty.';
    }
    if (form.giftEnabled && !form.giftTitle.trim()) return 'Enter the free gift title, or turn the free gift off.';
    if (form.addonEnabled && (!form.addonTitle.trim() || !form.addonPrice || Number(form.addonPrice) <= 0)) {
      return 'The offer addon needs a title and an additional price, or turn it off.';
    }
    if (uploading) return 'Please wait for the upload to finish.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(isEdit ? `${API_URL}/products/${productId}` : `${API_URL}/products`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payloadFromForm(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
      router.push(`/dashboard/products?${isEdit ? 'updated' : 'created'}=success`);
    } catch (err: any) {
      setError(err.message || 'Error saving product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return <div className="py-24 text-center text-sm font-semibold text-gray-500">Loading product...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            aria-label="Back to products"
            className="p-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111111]">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Everything saved here is what customers see in the catalog, product page and customizer.
            </p>
          </div>
        </div>

        {!isEdit && (
          <div className="flex flex-wrap items-center gap-2 bg-[#F8F9FC] border border-[#E5E7EB] p-1.5 rounded-xl">
            <span className="text-[11px] font-bold text-gray-600 px-2 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#3B6FEB]" /> Presets:
            </span>
            {(
              [
                ['MUG', '☕', 'Cup / Mug', isMugCategory],
                ['BAG', '🎒', 'Backpack / Bag', isBagCategory],
                ['CAP', '🧢', 'Cap / Headwear', isCapCategory],
                ['POLO', '👕', 'Polo T-Shirt', false],
              ] as Array<[PresetKey, string, string, boolean]>
            ).map(([key, emoji, label, active]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  active ? 'bg-[#3B6FEB] text-white shadow-xs' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          data-cy="product-form-error"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* BASIC INFORMATION */}
          <Section
            id="basic"
            title="Basic Information"
            icon={<Package className="w-4 h-4 text-[#3B6FEB]" />}
            badge={
              isMugCategory ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">☕ Cup / Mug Mode Active</span>
              ) : isBagCategory ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">🎒 Bag / Backpack Mode Active</span>
              ) : isCapCategory ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">🧢 Headwear Mode Active</span>
              ) : undefined
            }
          >
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                type="text"
                data-cy="product-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Classic Promotional Structured Cotton Cap"
                className={`${inputClass} font-bold`}
              />
            </div>
            <div>
              <label className={labelClass}>Slug (URL) *</label>
              <input
                type="text"
                data-cy="product-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
                placeholder="e.g. classic-cotton-cap"
                className={`${inputClass} font-mono text-xs`}
              />
              <p className="text-[10px] text-gray-400 mt-1">Product page address: /products/{form.slug || 'your-slug'}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#374151]">Description</label>
                <button
                  type="button"
                  onClick={() => set('description', presetDescription)}
                  className="text-[11px] font-bold text-[#3B6FEB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert {presetLabel} Specs Template</span>
                </button>
              </div>
              <textarea
                rows={6}
                data-cy="product-description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Enter comprehensive material, GSM, panel structure, closure, and custom branding specifications..."
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
            </div>
          </Section>

          {/* PRICING & STOCK */}
          <Section id="pricing" title="Pricing & Stock" icon={<IndianRupee className="w-4 h-4 text-[#3B6FEB]" />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Base Price (₹) *</label>
                <input
                  type="number"
                  min="1"
                  data-cy="product-base-price"
                  // Show empty rather than a sticky "0" so the field can be cleared and retyped.
                  value={form.basePrice}
                  onChange={(e) => set('basePrice', numberOrBlank(e.target.value))}
                  placeholder="149"
                  className={`${inputClass} font-black`}
                />
              </div>
              <div>
                <label className={labelClass}>Min. Order Qty</label>
                <input
                  type="number"
                  min="1"
                  data-cy="product-moq"
                  value={form.minOrderQty}
                  onChange={(e) => set('minOrderQty', numberOrBlank(e.target.value))}
                  placeholder="e.g. 20"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Stock Count</label>
                <input
                  type="number"
                  min="0"
                  data-cy="product-stock"
                  value={form.stockCount}
                  onChange={(e) => set('stockCount', numberOrBlank(e.target.value))}
                  placeholder="e.g. 500"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Min. Sample Qty</label>
                <input
                  type="number"
                  min="1"
                  data-cy="product-sample-qty"
                  value={form.minSampleQty}
                  onChange={(e) => set('minSampleQty', numberOrBlank(e.target.value))}
                  placeholder="e.g. 1"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider">Quantity Range Pricing</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
                Customers and quotes are charged the price of the range their quantity falls in. Below the first range the base price applies.
                Leave Max Qty empty for &ldquo;and above&rdquo;.
              </p>
              <div className="space-y-2.5">
                {form.ranges.map((range, i) => (
                  <div key={i} data-cy="pricing-range-row" className="flex items-end gap-2 bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                    {(
                      [
                        ['minQuantity', 'Min Qty'],
                        ['maxQuantity', 'Max Qty'],
                        ['pricePerUnit', 'Price per piece (₹)'],
                      ] as Array<[keyof RangeRow, string]>
                    ).map(([key, label]) => (
                      <div key={key} className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold block">{label}</label>
                        <input
                          type="number"
                          min="1"
                          data-cy={`range-${key}`}
                          value={range[key] as number | ''}
                          onChange={(e) =>
                            set(
                              'ranges',
                              form.ranges.map((r, idx) => (idx === i ? { ...r, [key]: numberOrBlank(e.target.value) } : r))
                            )
                          }
                          className="w-full px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold outline-none focus:border-[#3B6FEB]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      aria-label="Remove range"
                      onClick={() => set('ranges', form.ranges.filter((_, idx) => idx !== i))}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                data-cy="add-range"
                onClick={() => {
                  const last = form.ranges[form.ranges.length - 1];
                  const nextMin = last && last.maxQuantity !== '' ? Number(last.maxQuantity) + 1 : last ? '' : Number(form.minOrderQty) || 1;
                  set('ranges', [...form.ranges, { minQuantity: nextMin, maxQuantity: '', pricePerUnit: '' }]);
                }}
                className="mt-2.5 w-full py-2.5 border-2 border-dashed border-[#E5E7EB] hover:border-[#3B6FEB] text-xs font-bold text-[#3B6FEB] rounded-xl hover:bg-blue-50/40 transition-all"
              >
                + Add Range
              </button>
            </div>
          </Section>

          {/* SOCIAL PROOF */}
          <Section
            id="social"
            title="Social Proof / Review Display"
            icon={<Star className="w-4 h-4 text-[#3B6FEB]" />}
            hint="Optional. Leave blank to show the product's real published reviews instead."
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Rating (0–5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  data-cy="product-rating"
                  value={form.rating}
                  onChange={(e) => set('rating', numberOrBlank(e.target.value))}
                  placeholder="e.g. 4.8"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Review Count</label>
                <input
                  type="number"
                  min="0"
                  data-cy="product-review-count"
                  value={form.reviewCount}
                  onChange={(e) => set('reviewCount', numberOrBlank(e.target.value))}
                  placeholder="e.g. 154"
                  className={inputClass}
                />
              </div>
            </div>
          </Section>

          {/* AVAILABLE SIZES */}
          <Section id="sizes" title="Available Sizes" icon={<Ruler className="w-4 h-4 text-[#3B6FEB]" />}>
            <Toggle
              cy="requires-size"
              checked={form.requiresSize}
              onChange={(next) => set('requiresSize', next)}
              label="Ask customers to select a size"
              description="Turn off for one-size products such as caps, bags and mugs."
            />
            {form.requiresSize && (
              <>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...STANDARD_SIZES, ...form.sizes])).map((size) => {
                    const selected = form.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        data-cy={`size-${size}`}
                        aria-pressed={selected}
                        onClick={() => toggleSize(size)}
                        className={`min-w-[48px] px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                          selected ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#F9FAFB] text-gray-600 border-[#E5E7EB] hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 max-w-xs">
                  <input
                    type="text"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSize();
                      }
                    }}
                    placeholder="Other size, e.g. 4XL"
                    className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#3B6FEB]"
                  />
                  <button type="button" onClick={addCustomSize} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] hover:bg-gray-50">
                    Add
                  </button>
                </div>
              </>
            )}
          </Section>

          {/* AVAILABLE COLORS */}
          <Section
            id="colors"
            title="Available Colors"
            icon={<Palette className="w-4 h-4 text-[#3B6FEB]" />}
            hint="Customers and the customizer see exactly these colours for this product."
          >
            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.colors.map((color) => (
                  <span
                    key={color.name}
                    data-cy="color-chip"
                    className="inline-flex items-center gap-2 pl-2 pr-1 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs font-bold text-[#111111]"
                  >
                    <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
                    {color.name}
                    <span className="font-mono text-[10px] text-gray-400">{color.hex}</span>
                    <button type="button" aria-label={`Remove ${color.name}`} onClick={() => removeColor(color.name)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] text-gray-400 font-bold block">Color name</label>
                <input
                  type="text"
                  data-cy="color-name"
                  value={colorName}
                  onChange={(e) => {
                    setColorName(e.target.value);
                    const known = getColorHex(e.target.value);
                    if (known !== '#262626' && known.startsWith('#')) setColorHex(known);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  placeholder="e.g. Matte Black"
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-bold outline-none focus:border-[#3B6FEB]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block">Color value</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    data-cy="color-hex"
                    aria-label="Pick a colour"
                    value={HEX_COLOR.test(colorHex) ? colorHex : '#111111'}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-12 h-[34px] p-0.5 bg-white border border-[#E5E7EB] rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    data-cy="color-hex-text"
                    aria-label="Colour hex code"
                    value={colorHex}
                    maxLength={7}
                    spellCheck={false}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      setColorHex(raw && !raw.startsWith('#') ? `#${raw}` : raw);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                    placeholder="#000000"
                    className={`w-24 px-3 py-2 bg-[#F9FAFB] border rounded-lg text-xs font-mono font-bold uppercase outline-none focus:border-[#3B6FEB] ${
                      HEX_COLOR.test(colorHex) ? 'border-[#E5E7EB]' : 'border-red-300'
                    }`}
                  />
                </div>
              </div>
              <button
                type="button"
                data-cy="add-color"
                onClick={addColor}
                className="px-4 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Color
              </button>
            </div>
          </Section>

          {/* STOCK DEDUCTION */}
          <Section
            id="stock"
            title="Stock Deduction"
            icon={<Lock className="w-4 h-4 text-[#3B6FEB]" />}
            hint="When an order is created, each ordered colour reduces the stock type it is mapped to."
            badge={
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold whitespace-nowrap">
                Internal only — never shown to customers
              </span>
            }
          >
            <Toggle
              cy="stock-enabled"
              checked={form.stockEnabled}
              onChange={(next) => set('stockEnabled', next)}
              label="Deduct stock by stock type"
              description="Without this, orders only reduce the overall Stock Count."
            />
            {form.stockPools.map((pool, i) => (
              <div key={i} data-cy="stock-pool" className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-2.5">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold block">Stock type</label>
                    <input
                      type="text"
                      data-cy="stock-type"
                      value={pool.stockType}
                      onChange={(e) => updatePool(i, { stockType: e.target.value })}
                      placeholder="e.g. Dark blank caps"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold outline-none focus:border-[#3B6FEB]"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] text-gray-400 font-bold block">Stock</label>
                    <input
                      type="number"
                      min="0"
                      data-cy="stock-type-qty"
                      value={pool.stock}
                      onChange={(e) => updatePool(i, { stock: numberOrBlank(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono outline-none focus:border-[#3B6FEB]"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove stock type"
                    onClick={() => set('stockPools', form.stockPools.filter((_, idx) => idx !== i))}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">Colors mapped to this stock type</span>
                  {colorNames.length === 0 ? (
                    <p className="text-[11px] text-gray-500">Add colours in &ldquo;Available Colors&rdquo; first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {colorNames.map((name) => {
                        const selected = pool.colors.includes(name);
                        const takenElsewhere = !selected && mappedColors.has(name.toLowerCase());
                        return (
                          <button
                            key={name}
                            type="button"
                            data-cy={`stock-color-${name}`}
                            aria-pressed={selected}
                            onClick={() => togglePoolColor(i, name)}
                            title={takenElsewhere ? 'Mapped to another stock type — click to move it here' : undefined}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              selected
                                ? 'bg-[#3B6FEB] text-white border-[#3B6FEB]'
                                : takenElsewhere
                                  ? 'bg-white text-gray-400 border-dashed border-gray-300'
                                  : 'bg-white text-gray-700 border-[#E5E7EB] hover:border-[#3B6FEB]'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              data-cy="add-stock-type"
              onClick={() => set('stockPools', [...form.stockPools, { stockType: '', colors: [], stock: '' }])}
              className="w-full py-2.5 border-2 border-dashed border-[#E5E7EB] hover:border-[#3B6FEB] text-xs font-bold text-[#3B6FEB] rounded-xl hover:bg-blue-50/40 transition-all"
            >
              + Add Stock Type
            </button>
          </Section>

          {/* RECENT ORDER IMAGES */}
          <Section
            id="order-images"
            title={`Recent Order Images (${form.orderImages.length})`}
            icon={<Camera className="w-4 h-4 text-[#3B6FEB]" />}
            hint="Customer order / reference photos shown on the product page as trust images."
          >
            <div className="space-y-2" data-cy="order-image-details">
              <input
                type="text"
                data-cy="order-image-keyword"
                maxLength={60}
                value={orderImageDraft.keyword}
                onChange={(e) => setOrderImageDraft((d) => ({ ...d, keyword: e.target.value }))}
                placeholder="Keyword (optional), e.g. Kalka's"
                className={smallInput}
              />
              <textarea
                data-cy="order-image-review"
                rows={2}
                maxLength={300}
                value={orderImageDraft.review}
                onChange={(e) => setOrderImageDraft((d) => ({ ...d, review: e.target.value }))}
                placeholder="Customer review text (optional)"
                className={smallInput}
              />
              <input
                type="text"
                data-cy="order-image-description"
                maxLength={200}
                value={orderImageDraft.description}
                onChange={(e) => setOrderImageDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description (optional), then click Upload Photo"
                className={smallInput}
              />
            </div>
            <UploadZone
              cy="order-image-file"
              label="Upload Photo"
              hint="PNG, JPG, WEBP up to 5MB"
              accept="image/png, image/jpeg, image/webp"
              disabled={form.orderImages.length >= MAX_ORDER_IMAGES}
              uploading={uploading === 'orderImage'}
              onFile={(file) => upload('orderImage', file)}
            />
            {form.orderImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.orderImages.map((item, i) => (
                  <div key={item.url} data-cy="order-image-item" className="space-y-1.5">
                    <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative group">
                      <img src={item.url} alt="Customer order" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => set('orderImages', form.orderImages.filter((_, idx) => idx !== i))}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <StarRating
                      value={item.rating}
                      onChange={(rating) => set('orderImages', form.orderImages.map((m, idx) => (idx === i ? { ...m, rating } : m)))}
                    />
                    {(['keyword', 'review', 'description'] as const).map((field) => (
                      <input
                        key={field}
                        type="text"
                        data-cy={`order-image-item-${field}`}
                        maxLength={field === 'review' ? 300 : field === 'keyword' ? 60 : 200}
                        value={item[field] ?? ''}
                        onChange={(e) =>
                          set('orderImages', form.orderImages.map((m, idx) => (idx === i ? { ...m, [field]: e.target.value } : m)))
                        }
                        placeholder={field === 'keyword' ? 'Keyword' : field === 'review' ? 'Customer review' : 'Description'}
                        className={smallInput}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* PRODUCT VIDEOS */}
          <Section
            id="videos"
            title={`Product Videos (${form.videos.length}/${MAX_VIDEOS})`}
            icon={<Video className="w-4 h-4 text-[#3B6FEB]" />}
            hint="Drag to reorder. The top 2 are shown on the customer product page as “Watch & Buy”."
          >
            <input
              type="text"
              data-cy="video-title"
              maxLength={80}
              value={videoTitleDraft}
              onChange={(e) => setVideoTitleDraft(e.target.value)}
              placeholder="Video title (optional), then click Upload Video"
              className={smallInput}
            />
            <UploadZone
              cy="video-file"
              label="Upload Video"
              hint="MP4, MOV or WEBM up to 100MB"
              accept="video/mp4, video/quicktime, video/webm"
              disabled={form.videos.length >= MAX_VIDEOS}
              uploading={uploading === 'video'}
              onFile={(file) => upload('video', file)}
            />
            {form.videos.length > 0 && (
              <ul className="space-y-2">
                {form.videos.map((item, i) => (
                  <li
                    key={item.url}
                    data-cy="video-item"
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null) set('videos', moveItem(form.videos, dragIndex, i));
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-3 p-2.5 bg-[#F9FAFB] border rounded-xl ${
                      dragIndex === i ? 'border-[#3B6FEB] opacity-60' : 'border-[#E5E7EB]'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" />
                    <video
                      src={item.url}
                      poster={getVideoPoster(item.url)}
                      preload="metadata"
                      muted
                      className="w-20 h-14 rounded-lg bg-black object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111111]">{item.title || `Video ${i + 1}`}</span>
                        {i < 2 && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">
                            Watch &amp; Buy
                          </span>
                        )}
                      </div>
                      <StarRating
                        value={item.rating}
                        onChange={(rating) => set('videos', form.videos.map((m, idx) => (idx === i ? { ...m, rating } : m)))}
                      />
                      <input
                        type="text"
                        data-cy="video-item-title"
                        maxLength={80}
                        value={item.title ?? ''}
                        onChange={(e) => set('videos', form.videos.map((m, idx) => (idx === i ? { ...m, title: e.target.value } : m)))}
                        placeholder="Title (optional)"
                        className={smallInput}
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Move up"
                        data-cy="video-move-up"
                        disabled={i === 0}
                        onClick={() => set('videos', moveItem(form.videos, i, i - 1))}
                        className="p-1.5 text-gray-500 hover:text-[#111111] disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={i === form.videos.length - 1}
                        onClick={() => set('videos', moveItem(form.videos, i, i + 1))}
                        className="p-1.5 text-gray-500 hover:text-[#111111] disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove video"
                        onClick={() => set('videos', form.videos.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* FREE GIFT */}
          <Section id="gift" title="Free Gift" icon={<Gift className="w-4 h-4 text-[#3B6FEB]" />} hint="A customer-facing offer shown on the product page and at checkout.">
            <Toggle cy="gift-enabled" checked={form.giftEnabled} onChange={(next) => set('giftEnabled', next)} label="Show a free gift with this product" />
            {form.giftEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Gift title *</label>
                  <input
                    type="text"
                    data-cy="gift-title"
                    value={form.giftTitle}
                    onChange={(e) => set('giftTitle', e.target.value)}
                    placeholder="e.g. Free sticker pack"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>From quantity</label>
                  <input
                    type="number"
                    min="1"
                    data-cy="gift-min-qty"
                    value={form.giftMinQuantity}
                    onChange={(e) => set('giftMinQuantity', numberOrBlank(e.target.value))}
                    placeholder="Any quantity"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Details</label>
                  <input
                    type="text"
                    data-cy="gift-description"
                    value={form.giftDescription}
                    onChange={(e) => set('giftDescription', e.target.value)}
                    placeholder="e.g. Included with every order"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </Section>

          {/* OFFER ADDON */}
          <Section
            id="addon"
            title="Offer Addon"
            icon={<BadgePlus className="w-4 h-4 text-[#3B6FEB]" />}
            hint="A one-time offer shown at customizer checkout. The customer chooses whether to add it; the server adds the charge."
          >
            <Toggle cy="addon-enabled" checked={form.addonEnabled} onChange={(next) => set('addonEnabled', next)} label="Offer an addon at checkout" />
            {form.addonEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className={labelClass}>Addon title *</label>
                  <input
                    type="text"
                    data-cy="addon-title"
                    value={form.addonTitle}
                    onChange={(e) => set('addonTitle', e.target.value)}
                    placeholder="e.g. Premium gift box"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Additional price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    data-cy="addon-price"
                    value={form.addonPrice}
                    onChange={(e) => set('addonPrice', numberOrBlank(e.target.value))}
                    placeholder="e.g. 15"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Charged</label>
                  <select
                    data-cy="addon-price-type"
                    value={form.addonPriceType}
                    onChange={(e) => set('addonPriceType', e.target.value as FormState['addonPriceType'])}
                    className={inputClass}
                  >
                    <option value="PER_ORDER">Once per order</option>
                    <option value="PER_PIECE">Per piece</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Details</label>
                  <input
                    type="text"
                    data-cy="addon-description"
                    value={form.addonDescription}
                    onChange={(e) => set('addonDescription', e.target.value)}
                    placeholder="e.g. Each piece individually boxed"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </Section>

          {/* HIGHLIGHTS */}
          <Section id="highlights" title="Highlights" icon={<ListChecks className="w-4 h-4 text-[#3B6FEB]" />} hint="Bullet points shown on the customer product page.">
            {form.highlights.length > 0 && (
              <ul className="space-y-1.5">
                {form.highlights.map((item, i) => (
                  <li key={i} data-cy="highlight-item" className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => set('highlights', form.highlights.map((h, idx) => (idx === i ? e.target.value : h)))}
                      className="flex-1 px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#3B6FEB]"
                    />
                    <button
                      type="button"
                      aria-label="Remove highlight"
                      onClick={() => set('highlights', form.highlights.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                data-cy="highlight-input"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightInput.trim()) {
                      set('highlights', [...form.highlights, highlightInput.trim()]);
                      setHighlightInput('');
                    }
                  }
                }}
                placeholder="e.g. 6-panel structured crown"
                className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#3B6FEB]"
              />
              <button
                type="button"
                data-cy="add-highlight"
                onClick={() => {
                  if (!highlightInput.trim()) return;
                  set('highlights', [...form.highlights, highlightInput.trim()]);
                  setHighlightInput('');
                }}
                className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* ORDER TYPE & SETTINGS */}
          <Section id="settings" title="Order Type & Settings" icon={<Settings2 className="w-4 h-4 text-[#3B6FEB]" />}>
            <div>
              <span className={labelClass}>Order type</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['SINGLE', 'Single Order'],
                    ['BULK', 'Bulk Order'],
                    ['BOTH', 'Both Modes'],
                  ] as Array<[OrderMode, string]>
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    data-cy={`order-mode-${mode}`}
                    aria-pressed={form.orderMode === mode}
                    onClick={() => set('orderMode', mode)}
                    className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${
                      form.orderMode === mode ? 'bg-[#111111] text-white border-black' : 'bg-[#F9FAFB] text-gray-500 border-[#E5E7EB]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select
                data-cy="product-category"
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className={`${inputClass} text-xs font-bold`}
              >
                {loadingCats ? (
                  <option>Loading categories...</option>
                ) : (
                  <>
                    {!form.categoryId && <option value="">Select category</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <span className={labelClass}>Product Status</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => set('isActive', true)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    form.isActive ? 'bg-[#111111] text-white border-black' : 'bg-[#F9FAFB] text-gray-500 border-[#E5E7EB]'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => set('isActive', false)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    !form.isActive ? 'bg-[#111111] text-white border-black' : 'bg-[#F9FAFB] text-gray-500 border-[#E5E7EB]'
                  }`}
                >
                  Draft
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {form.isActive ? 'Active: visible on the website and customer catalog.' : 'Draft: hidden from customers and cannot be quoted.'}
              </p>
            </div>
          </Section>

          {/* DESIGNER */}
          <Section id="designer" title="T-Shirt Designer / Customizer" icon={<Brush className="w-4 h-4 text-[#3B6FEB]" />}>
            <Toggle
              cy="customizer-enabled-toggle"
              secondaryCy="customization-enabled"
              checked={form.customizationEnabled}
              onChange={(next) => {
                set('customizationEnabled', next);
                set('designerEnabled', next);
              }}
              label="Enable Customizer for this product"
              description={
                form.customizationEnabled
                  ? 'Customers get the “Design Your Own” studio for this product using a reusable template.'
                  : 'Customizer is disabled. Customers cannot customize this product online.'
              }
            />

            {form.customizationEnabled && (
              <div className="pt-3 border-t border-[#E5E7EB] space-y-3" data-cy="customizer-template-wrapper">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={labelClass}>Customizer Template</span>
                    <Link
                      href="/dashboard/customizer-templates"
                      className="text-[11px] text-[#3B6FEB] hover:underline font-semibold"
                      target="_blank"
                    >
                      Configure Template Assets ↗
                    </Link>
                  </div>
                  <select
                    data-cy="customizer-template-select"
                    value={form.customizerTemplateId}
                    onChange={(e) => set('customizerTemplateId', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111111] focus:border-[#3B6FEB] focus:bg-white outline-none"
                  >
                    <option value="">Select Template ▼</option>
                    {listReusableTemplates().map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Select a reusable customizer template before enabling customization.
                  </p>
                </div>

                {selectedTemplate && (
                  <div className="p-3.5 bg-[#F8F9FC] rounded-xl border border-[#E5E7EB] space-y-2 text-xs" data-cy="customizer-template-preview">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111]">{selectedTemplate.name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                        v{selectedTemplate.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">{selectedTemplate.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-gray-200">
                      <div>
                        <span className="font-bold text-gray-500 block">Color Groups:</span>
                        <span className="text-gray-800">{selectedTemplate.colorGroups.map((g) => g.label).join(' • ')}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block">Print Areas:</span>
                        <span className="text-gray-800">
                          {selectedTemplate.printAreas.map((a) => `${a.side === 'front' ? 'Front' : 'Back'}: ${a.label || 'Standard'}`).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTemplate && (
                  <div className="pt-3 border-t border-[#E5E7EB] space-y-3" data-cy="customizer-features-wrapper">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Customization Features</span>
                      <span className="text-[10px] text-gray-400 font-medium">Product-level controls</span>
                    </div>
                    <div className="space-y-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                      {templateCapabilities.supportsTrimColor && (
                        <Toggle
                          cy="feature-trim-color"
                          checked={form.trimColorEnabled}
                          onChange={(next) => set('trimColorEnabled', next)}
                          label="Enable collar & rib color customization"
                          description="Allows customers to independently customize collar and ribbing colors."
                        />
                      )}
                      {templateCapabilities.supportsTapingColor && (
                        <Toggle
                          cy="feature-taping-color"
                          checked={form.tapingColorEnabled}
                          onChange={(next) => set('tapingColorEnabled', next)}
                          label="Enable taping color customization"
                          description="Allows customers to customize inner collar/neck taping color."
                        />
                      )}
                      {templateCapabilities.supportsBack && (
                        <Toggle
                          cy="feature-back-design"
                          checked={form.backDesignEnabled}
                          onChange={(next) => set('backDesignEnabled', next)}
                          label="Enable back design / mockup"
                          description="Allows customers to switch to back view and add back artwork."
                        />
                      )}
                      {templateCapabilities.supportsEmbroidery && (
                        <Toggle
                          cy="feature-embroidery"
                          checked={form.embroideryEnabled}
                          onChange={(next) => set('embroideryEnabled', next)}
                          label="Enable embroidery option"
                          description="Allows customers to choose embroidery branding method."
                        />
                      )}
                      {templateCapabilities.supportsZipper && (
                        <Toggle
                          cy="feature-zipper"
                          checked={form.zipperEnabled}
                          onChange={(next) => set('zipperEnabled', next)}
                          label="Enable zipper option"
                          description="Allows customers to customize zipper options."
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* PRODUCT IMAGES */}
          <Section id="images" title={`Product Images (${form.images.length})`} icon={<ImageIcon className="w-4 h-4 text-[#3B6FEB]" />} hint={`Up to ${MAX_IMAGES}. The first image is the catalog thumbnail.`}>
            <UploadZone
              cy="product-image-file"
              label="Click to Upload Product Asset"
              hint="PNG, JPG, WEBP up to 5MB"
              accept="image/png, image/jpeg, image/webp"
              disabled={form.images.length >= MAX_IMAGES}
              uploading={uploading === 'image'}
              onFile={(file) => upload('image', file)}
            />
            <div className="flex gap-2">
              <input
                type="url"
                data-cy="image-url-input"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="or paste image URL"
                className="flex-1 min-w-0 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#3B6FEB]"
              />
              <button
                type="button"
                data-cy="add-image-url"
                onClick={addImageUrl}
                disabled={form.images.length >= MAX_IMAGES}
                className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] hover:bg-gray-50 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {form.images.map((img, i) => (
                  <div key={img} data-cy="product-image-item" className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative">
                    <img src={img} alt="Product preview" className="w-full h-full object-contain p-2" />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#111111] text-white rounded text-[9px] font-bold">Primary</span>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {i > 0 && (
                        <button
                          type="button"
                          aria-label="Make primary"
                          title="Make primary"
                          onClick={() => set('images', moveItem(form.images, i, 0))}
                          className="bg-white text-gray-700 border border-gray-200 rounded-full p-1 shadow-sm"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                        className="bg-red-500 text-white rounded-full p-1 shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* CUSTOMIZER VIEWS */}
          <Section
            id="customizer-views"
            title="Customizer Views"
            icon={<Layers className="w-4 h-4 text-[#3B6FEB]" />}
            hint="The product photos customers design on. Pick the front and back from the images above."
          >
            <CustomizerViewsEditor
              images={form.images}
              value={form.views}
              onChange={(views) => set('views', views)}
              colors={form.colors.filter((c) => c.name.trim() && HEX_COLOR.test(c.hex))}
              onUploading={(busy) => setUploading(busy ? 'mask' : null)}
            />
          </Section>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-3 lg:sticky lg:top-4">
            <button
              type="submit"
              data-cy="product-submit"
              disabled={saving || uploading !== null}
              className="w-full py-3 bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving Product...' : isEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
            <Link
              href="/dashboard/products"
              className="block w-full py-2.5 text-center bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-[#E5E7EB] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
