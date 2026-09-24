'use client';

import React, { useState } from 'react';
import { Download, Eye, ExternalLink, X, FileText, Check, Loader2 } from 'lucide-react';

export interface DesignAsset {
  type: 'artwork' | 'front' | 'back';
  label: string;
  title: string;
  url: string;
  orderNumber?: string;
  productName?: string;
  customerName?: string;
}

/**
 * Optimizes Cloudinary URLs for small thumbnail cards.
 * Avoids loading full-size multi-megabyte customer artwork.
 */
export function getOptimizedThumbnailUrl(url: string, width = 96): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/c_')) {
    return url.replace('/upload/', `/upload/c_scale,w_${width},q_auto,f_auto/`);
  }
  return url;
}

/**
 * Extracts extension from URL (png, jpg, webp, svg, pdf)
 */
export function getAssetExtension(url: string): string {
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    }
  } catch {
    // fallback
  }
  return 'png';
}

function extractArtworkFromDetails(details?: string | null): string | null {
  if (!details || typeof details !== 'string') return null;
  const match = details.match(/Artwork:\s*(https?:\/\/[^\s|]+)/i);
  return match ? match[1] : null;
}

function extractPreviewFromDetails(details: string | null | undefined, side: 'front' | 'back'): string | null {
  if (!details || typeof details !== 'string') return null;
  const pattern = side === 'front' 
    ? /Front\s*Preview:\s*(https?:\/\/[^\s|]+)/i 
    : /Back\s*Preview:\s*(https?:\/\/[^\s|]+)/i;
  const match = details.match(pattern);
  return match ? match[1] : null;
}

/**
 * Resolves artwork, front preview, and back preview for an order or item.
 * 
 * Rules:
 * 1. Customer artwork NEVER substitutes catalog product images.
 * 2. CanvasStateJson is never treated as an image URL.
 * 3. In multi-item orders, each item resolves its own assets without bleeding across items.
 */
export function getOrderDesignAssets(order: any, item?: any): DesignAsset[] {
  if (!order) return [];

  const assets: DesignAsset[] = [];
  const orderNumber = order.orderNumber || '';
  const customerName = order.quote?.inquiry?.customerName || order.customer?.name || '';
  const productName = item?.product?.name || order.items?.[0]?.product?.name || order.quote?.inquiry?.productInterest || 'Custom Item';

  const isMultiItem = order.items && order.items.length > 1;

  let artworkUrl: string | null = null;
  let previewFrontUrl: string | null = null;
  let previewBackUrl: string | null = null;

  if (isMultiItem && item) {
    // Multi-item order: resolve specifically for this item
    artworkUrl = item.artworkUrl || extractArtworkFromDetails(item.customizationDetails) || null;
    previewFrontUrl = item.previewFrontUrl || extractPreviewFromDetails(item.customizationDetails, 'front') || null;
    previewBackUrl = item.previewBackUrl || extractPreviewFromDetails(item.customizationDetails, 'back') || null;
  } else {
    // Single-item order or general order fallback
    artworkUrl = 
      item?.artworkUrl || 
      extractArtworkFromDetails(item?.customizationDetails) || 
      order.artworkUrl || 
      order.quote?.artworkUrl || 
      order.quote?.inquiry?.artworkUrl || 
      null;

    previewFrontUrl = 
      item?.previewFrontUrl || 
      extractPreviewFromDetails(item?.customizationDetails, 'front') || 
      order.previewFrontUrl || 
      order.quote?.previewFrontUrl || 
      null;

    previewBackUrl = 
      item?.previewBackUrl || 
      extractPreviewFromDetails(item?.customizationDetails, 'back') || 
      order.previewBackUrl || 
      order.quote?.previewBackUrl || 
      null;
  }

  // 1. Artwork
  if (artworkUrl && typeof artworkUrl === 'string' && artworkUrl.trim().startsWith('http')) {
    assets.push({
      type: 'artwork',
      label: 'Artwork',
      title: 'Customer Artwork',
      url: artworkUrl.trim(),
      orderNumber,
      productName,
      customerName,
    });
  }

  // 2. Front Preview
  if (previewFrontUrl && typeof previewFrontUrl === 'string' && previewFrontUrl.trim().startsWith('http')) {
    assets.push({
      type: 'front',
      label: 'Front',
      title: 'Front Design Preview',
      url: previewFrontUrl.trim(),
      orderNumber,
      productName,
      customerName,
    });
  }

  // 3. Back Preview
  if (previewBackUrl && typeof previewBackUrl === 'string' && previewBackUrl.trim().startsWith('http')) {
    assets.push({
      type: 'back',
      label: 'Back',
      title: 'Back Design Preview',
      url: previewBackUrl.trim(),
      orderNumber,
      productName,
      customerName,
    });
  }

  return assets;
}

/**
 * Downloads design asset with automatic fallback to new tab on block.
 * Uses format: ZOBBRA-{orderNumber}-{assetType}.{ext}
 */
export async function downloadDesignAsset(
  url: string,
  orderNumber: string,
  assetType: 'artwork' | 'front' | 'back'
): Promise<boolean> {
  const ext = getAssetExtension(url);
  const cleanOrder = (orderNumber || 'ORDER').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `ZOBBRA-${cleanOrder}-${assetType}.${ext}`;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return true;
  } catch (err) {
    console.warn('Direct blob download failed, falling back to open in tab:', err);
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      window.location.href = url;
    }
    return true;
  }
}

interface OrderDesignAssetsProps {
  order: any;
  item?: any;
  onViewAsset: (asset: DesignAsset) => void;
  className?: string;
}

/**
 * Compact thumbnail row rendered inside the Product table cell or item cards.
 */
export function OrderDesignAssets({ order, item, onViewAsset, className = '' }: OrderDesignAssetsProps) {
  const assets = getOrderDesignAssets(order, item);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-1.5 flex-wrap mt-1 ${className}`}
      data-cy="order-design-assets"
      onClick={(e) => e.stopPropagation()}
    >
      {assets.map((asset) => {
        const isPdf = getAssetExtension(asset.url) === 'pdf';
        return (
          <button
            key={asset.type}
            type="button"
            data-cy={`asset-btn-${asset.type}`}
            title={`View ${asset.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewAsset(asset);
            }}
            className="group flex items-center gap-1.5 px-1.5 py-1 bg-[#F9FAFB] hover:bg-[#EEF2FF] border border-[#E5E7EB] hover:border-[#C7D2FE] rounded-md transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#3B6FEB]"
          >
            {isPdf ? (
              <div className="w-8 h-8 rounded bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-rose-600" />
              </div>
            ) : (
              <img
                src={getOptimizedThumbnailUrl(asset.url, 80)}
                alt={asset.title}
                className="w-8 h-8 rounded border border-[#E5E7EB] object-cover shrink-0 bg-white group-hover:scale-105 transition-transform"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex flex-col pr-1">
              <span className="text-[10px] font-bold text-[#1F2937] group-hover:text-[#3B6FEB] leading-tight">
                {asset.label}
              </span>
              <span className="text-[8px] text-[#6B7280] flex items-center gap-0.5 leading-none mt-0.5">
                <Eye className="w-2 h-2 inline" /> View
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface AssetPreviewModalProps {
  asset: DesignAsset | null;
  onClose: () => void;
}

/**
 * Preview modal / lightbox for customer artwork and design previews.
 */
export function AssetPreviewModal({ asset, onClose }: AssetPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!asset) return null;

  const isPdf = getAssetExtension(asset.url) === 'pdf';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadDesignAsset(asset.url, asset.orderNumber || 'ORDER', asset.type);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } finally {
      setDownloading(false);
    }
  };

  const getBadgeTitle = () => {
    switch (asset.type) {
      case 'artwork':
        return 'CUSTOMER ARTWORK';
      case 'front':
        return 'FRONT DESIGN PREVIEW';
      case 'back':
        return 'BACK DESIGN PREVIEW';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      data-cy="asset-preview-modal"
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-start justify-between gap-4 bg-[#FAFBFD]">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#EEF2FF] text-[#3B6FEB] mb-1.5">
              {getBadgeTitle()}
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-base text-[#111111]" data-cy="modal-order-number">
                {asset.orderNumber || 'Order'}
              </h3>
              <span className="text-[#9CA3AF]">•</span>
              <span className="text-xs font-semibold text-[#374151]" data-cy="modal-product-name">
                {asset.productName}
              </span>
            </div>
            {asset.customerName && (
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Customer: <span className="font-medium text-[#111111]">{asset.customerName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-cy="close-asset-modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Image Stage */}
        <div className="p-4 sm:p-6 bg-[#F8FAFC] flex items-center justify-center min-h-[300px] max-h-[58vh] overflow-auto">
          {isPdf ? (
            <div className="text-center p-8 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs max-w-md w-full">
              <FileText className="w-16 h-16 text-rose-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#111111] mb-1">PDF Artwork Document</h4>
              <p className="text-xs text-[#6B7280] mb-4">
                This artwork was uploaded as a PDF vector/document. Click below to view or download.
              </p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg hover:bg-gray-50 text-[#374151]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View PDF
                </a>
              </div>
            </div>
          ) : (
            <img
              src={asset.url}
              alt={asset.title}
              data-cy="modal-asset-img"
              className="max-h-[52vh] max-w-full object-contain rounded-lg border border-[#E2E8F0] shadow-sm bg-white"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-3">
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cy="modal-open-tab-link"
            className="text-xs text-[#6B7280] hover:text-[#3B6FEB] font-medium flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open full size in new tab
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#111111] bg-white hover:bg-gray-100 border border-[#D1D5DB] rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              data-cy="modal-download-btn"
              className="px-4 py-2 text-xs font-bold text-white bg-[#3B6FEB] hover:bg-[#2D5BD8] rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading...
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download Asset
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
