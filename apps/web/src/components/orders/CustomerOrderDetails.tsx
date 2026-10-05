'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  MapPin,
  Truck,
  Gift,
  ClipboardList,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { buildWhatsAppUrl, getOrderWhatsAppMessage } from '@/lib/whatsapp';
import {
  OrderDesignAssetsSection,
  AssetPreviewModal,
  DesignAsset,
  getOrderDesignAssets,
} from '@/components/orders/OrderDesignAssets';
import {
  CustomizerSpecificationsCard,
  extractCustomizerSpecs,
} from '@/components/customizer/CustomizerSpecificationsCard';

export interface CustomerOrderDetail {
  id: string;
  orderNumber: string;
  quoteId?: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  gstTotal: number;
  discountAmount?: number;
  totalAmount: number;
  createdAt: string;
  artworkUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  canvasStateJson?: string;
  addonTitle?: string | null;
  addonAmount?: number;
  freeGiftTitle?: string | null;
  customer?: { id: string; name: string; email?: string | null; phone?: string | null };
  company?: {
    name: string;
    gstin?: string | null;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  /** Delivery details frozen when the order was placed (absent on older orders). */
  deliveryAddress?: {
    name?: string | null;
    phone?: string | null;
    company?: string | null;
    address?: string | null;
    addressType?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
  quote?: {
    id?: string;
    quoteNumber?: string;
    artworkUrl?: string;
    previewFrontUrl?: string;
    previewBackUrl?: string;
    inquiry?: {
      customerName?: string;
      artworkUrl?: string;
      phone?: string;
      email?: string;
      productInterest?: string;
    };
  } | null;
  items?: Array<{
    id: string;
    productId?: string;
    product?: { name: string; images?: string[]; gstRate?: number };
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    artworkUrl?: string;
    previewFrontUrl?: string;
    previewBackUrl?: string;
    customizationDetails?: string | null;
    variants?: Array<{ id?: string; color?: string | null; size?: string | null; quantity: number }>;
  }>;
  payments?: Array<{
    id: string;
    razorpayPaymentId?: string | null;
    razorpayOrderId?: string | null;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  dispatch?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string | null;
    status: string;
    dispatchedAt: string;
    deliveredAt?: string | null;
  } | null;
}

export const formatOrderINR = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** Amount received so far: the successful payments recorded against the order. */
export function getOrderPaidAmount(order: CustomerOrderDetail): number {
  const paid = (order.payments || []).filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + (p.amount || 0), 0);
  // An order marked PAID without individual payment records (e.g. settled offline) is fully paid.
  return order.paymentStatus === 'PAID' ? Math.max(paid, order.totalAmount) : paid;
}

/**
 * Customer-readable order specifications. The order item carries the quote's notes as
 * "Label: value | Label: value"; the raw customizer JSON and the artwork URL (shown as assets
 * instead) are left out.
 */
export function getOrderSpecs(order: CustomerOrderDetail): Array<{ label: string; value: string }> {
  const raw = order.items?.find((item) => item.customizationDetails)?.customizationDetails;
  if (!raw) return [];
  const hidden = new Set(['customization', 'artwork', 'offer addon', 'free gift']);
  const specs: Array<{ label: string; value: string }> = [];
  for (const part of raw.split(' | ')) {
    const index = part.indexOf(': ');
    if (index <= 0) continue;
    const label = part.slice(0, index).trim();
    const value = part.slice(index + 2).trim();
    if (!value || hidden.has(label.toLowerCase()) || value.startsWith('{')) continue;
    specs.push({ label, value });
  }
  return specs;
}

const sectionTitle = 'text-[11px] font-black uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5 mb-2.5';
const panel = 'bg-white border border-[#E5E7EB] rounded-xl p-4';

function Row({ label, children, cy }: { label: string; children: React.ReactNode; cy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-bold text-[#111111] text-right" data-cy={cy}>
        {children}
      </span>
    </div>
  );
}

/**
 * Everything a customer can see about one of their orders. Used inline in the My Orders
 * accordion and on the direct /customer/orders/[id] page, so both always show the same data.
 */
export function CustomerOrderDetails({ order, fallbackPhone }: { order: CustomerOrderDetail; fallbackPhone?: string | null }) {
  const [selectedAsset, setSelectedAsset] = useState<DesignAsset | null>(null);

  const isPaid = order.paymentStatus === 'PAID';
  const paid = getOrderPaidAmount(order);
  const due = Math.max(0, order.totalAmount - paid);
  const gstRate = order.items?.[0]?.product?.gstRate;
  const specs = getOrderSpecs(order);
  const otherSpecs = specs.filter((s) => s.label.toLowerCase() !== 'delivery address');
  // The order's own snapshot wins, so later profile edits never change where it was sent.
  // Orders placed before snapshots existed fall back to the quote note, then the live profile.
  const snapshot = order.deliveryAddress;
  const company = snapshot
    ? { name: snapshot.company, address: snapshot.address, city: snapshot.city, state: snapshot.state, pincode: snapshot.pincode }
    : order.company;
  const deliveryAddress = snapshot
    ? snapshot.address || undefined
    : specs.find((s) => s.label.toLowerCase() === 'delivery address')?.value;
  const cityLine = [company?.city, company?.state, company?.pincode].filter(Boolean).join(', ');
  const hasAddress = Boolean(deliveryAddress || company?.address || cityLine);

  const effectivePhone = order.customer?.phone || fallbackPhone;
  const whatsappUrl = effectivePhone
    ? buildWhatsAppUrl(
        effectivePhone,
        getOrderWhatsAppMessage({
          customerName: order.customer?.name,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
        })
      )
    : null;

  const itemsHaveAssets = !!order.items?.some((item) => getOrderDesignAssets(order, item).length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-cy="order-details">
      {/* Items, variants and artwork */}
      <div className="lg:col-span-2 space-y-4 min-w-0">
        <section className={panel} data-cy="order-details-items">
          <h3 className={sectionTitle}>
            <Package className="w-3.5 h-3.5 text-[#3B6FEB]" /> Order Items
          </h3>
          <div className="divide-y divide-[#E5E7EB]">
            {order.items?.map((item) => {
              const image = item.product?.images?.[0];
              const variants = item.variants || [];
              return (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-3" data-cy="order-item">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 shrink-0 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt={item.product?.name || 'Product'} className="w-full h-full object-contain" data-cy="order-item-image" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" aria-label="No product image" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#111111] text-sm" data-cy="order-item-name">
                          {item.product?.name || 'Custom Merchandise'}
                        </h4>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {item.color && (
                            <>
                              Color: <span className="font-semibold text-[#111111]">{item.color}</span> ·{' '}
                            </>
                          )}
                          Print: <span className="font-semibold text-[#111111]">{item.printType}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-[#111111] text-sm" data-cy="order-item-total">
                          {formatOrderINR(item.totalPrice)}
                        </p>
                        <p className="text-xs text-[#6B7280]" data-cy="order-item-qty">
                          {item.quantity} Pcs @ {formatOrderINR(item.unitPrice)}/pc
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Colour / size quantity breakdown */}
                  {variants.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5" data-cy="order-item-variants">
                      {variants.map((v, i) => (
                        <span
                          key={v.id || i}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[11px] text-[#374151]"
                        >
                          {[v.color, v.size].filter(Boolean).join(' / ') || 'Standard'}
                          <span className="font-black text-[#111111]">× {v.quantity}</span>
                        </span>
                      ))}
                    </div>
                  ) : item.size ? (
                    <p className="text-[11px] text-[#6B7280]">
                      Size: <span className="font-semibold text-[#111111]">{item.size}</span>
                    </p>
                  ) : null}

                  {/* Item-specific Design & Artwork */}
                  <OrderDesignAssetsSection order={order} item={item} onViewAsset={(asset) => setSelectedAsset(asset)} />
                </div>
              );
            })}
          </div>

          {/* If order-level design assets exist and weren't already resolved by items */}
          {!itemsHaveAssets && <OrderDesignAssetsSection order={order} onViewAsset={(asset) => setSelectedAsset(asset)} />}
        </section>

        {/* Customizer Specifications Card (Phase 7) — shown only for customized orders */}
        {(() => {
          const firstItem = order.items?.find((item) => item.customizationDetails) || order.items?.[0];
          const specs = extractCustomizerSpecs({
            notes: firstItem?.customizationDetails,
            templateId: firstItem?.product ? (firstItem.product as any).customizerTemplateId : undefined,
            itemColor: firstItem?.color,
            printType: firstItem?.printType,
          });
          if (!specs) return null;
          return (
            <CustomizerSpecificationsCard
              specs={specs}
              dataCy="order-customizer-specifications"
            />
          );
        })()}

        {(otherSpecs.length > 0 || order.freeGiftTitle || order.addonTitle) && (
          <section className={panel} data-cy="order-details-specs">
            <h3 className={sectionTitle}>
              <ClipboardList className="w-3.5 h-3.5 text-[#3B6FEB]" /> Order Specifications
            </h3>
            <div className="space-y-2">
              {order.freeGiftTitle && (
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" /> Free gift: {order.freeGiftTitle}
                </p>
              )}
              {order.addonTitle && (
                <Row label="Addon">
                  {order.addonTitle}
                  {order.addonAmount ? ` (${formatOrderINR(order.addonAmount)})` : ''}
                </Row>
              )}
              {otherSpecs.map((spec) => (
                <div key={spec.label} className="text-xs flex flex-wrap gap-x-2">
                  <span className="text-[#6B7280]">{spec.label}:</span>
                  <span className="font-semibold text-[#111111] break-words min-w-0">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {order.payments && order.payments.length > 0 && (
          <section className={panel} data-cy="order-details-payments">
            <h3 className={sectionTitle}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Payment Audit Trail
            </h3>
            <div className="space-y-2">
              {order.payments.map((p) => (
                <div key={p.id} className="p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs flex flex-wrap justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-[#111111] break-all">
                      {formatOrderINR(p.amount)}
                      {p.razorpayPaymentId || p.razorpayOrderId ? ` · ${p.razorpayPaymentId || p.razorpayOrderId}` : ''}
                    </p>
                    <p className="text-[#6B7280] text-[11px] mt-0.5">{new Date(p.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Order summary, delivery and payment */}
      <div className="space-y-4 min-w-0">
        <section className={`${panel} space-y-2`} data-cy="order-details-summary">
          <h3 className={sectionTitle}>Order Details</h3>
          <Row label="Order number" cy="order-details-number">
            <span className="font-mono">{order.orderNumber}</span>
          </Row>
          <Row label="Order date">{new Date(order.createdAt).toLocaleDateString('en-IN')}</Row>
          {order.quote?.quoteNumber && <Row label="Quote">{order.quote.quoteNumber}</Row>}
          <Row label="Status">
            <StatusBadge status={order.status} />
          </Row>
          <Row label="Payment status">
            <StatusBadge status={order.paymentStatus} />
          </Row>
          <div className="pt-2 mt-1 border-t border-[#E5E7EB] space-y-2">
            <Row label="Merchandise subtotal">
              <span className="font-mono">{formatOrderINR(order.subtotal)}</span>
            </Row>
            {order.discountAmount ? (
              <Row label="Discount">
                <span className="font-mono">-{formatOrderINR(order.discountAmount)}</span>
              </Row>
            ) : null}
            <Row label={gstRate != null ? `GST (${gstRate}%)` : 'GST'}>
              <span className="font-mono">{formatOrderINR(order.gstTotal)}</span>
            </Row>
            <Row label="Total amount" cy="order-total-amount">
              <span className="font-mono text-sm">{formatOrderINR(order.totalAmount)}</span>
            </Row>
            <Row label="Paid" cy="order-paid-amount">
              <span className="font-mono text-emerald-700">{formatOrderINR(paid)}</span>
            </Row>
            <Row label="Due" cy="order-due-amount">
              <span className={`font-mono ${due > 0 ? 'text-amber-700' : ''}`}>{formatOrderINR(due)}</span>
            </Row>
          </div>
        </section>

        <section className={`${panel} space-y-1`} data-cy="order-details-delivery">
          <h3 className={sectionTitle}>
            <MapPin className="w-3.5 h-3.5 text-[#3B6FEB]" /> Delivery Address
          </h3>
          {order.customer?.name && <p className="text-xs font-bold text-[#111111]">{order.customer.name}</p>}
          {company?.name && <p className="text-xs text-[#374151]">{company.name}</p>}
          {effectivePhone && <p className="text-xs text-[#374151]">{effectivePhone}</p>}
          {hasAddress ? (
            <>
              <p className="text-xs text-[#374151] break-words">{deliveryAddress || company?.address}</p>
              {(snapshot || !deliveryAddress) && cityLine && <p className="text-xs text-[#374151]">{cityLine}</p>}
            </>
          ) : (
            <p className="text-xs text-[#6B7280]">No delivery address on file yet. Our sales team will confirm it with you.</p>
          )}
        </section>

        {order.dispatch && (
          <section className={`${panel} space-y-2`} data-cy="order-details-dispatch">
            <h3 className={sectionTitle}>
              <Truck className="w-3.5 h-3.5 text-[#3B6FEB]" /> Shipment
            </h3>
            <Row label="Courier">{order.dispatch.courierName}</Row>
            <Row label="Tracking number">
              {order.dispatch.trackingUrl ? (
                <a href={order.dispatch.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B6FEB] hover:underline font-mono">
                  {order.dispatch.trackingNumber}
                </a>
              ) : (
                <span className="font-mono">{order.dispatch.trackingNumber}</span>
              )}
            </Row>
            <Row label="Dispatched">{new Date(order.dispatch.dispatchedAt).toLocaleDateString('en-IN')}</Row>
            {order.dispatch.deliveredAt && <Row label="Delivered">{new Date(order.dispatch.deliveredAt).toLocaleDateString('en-IN')}</Row>}
          </section>
        )}

        {isPaid ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PAYMENT COMPLETED & VERIFIED</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Payment will be arranged with our sales team after order confirmation.
            </p>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cy="contact-sales-btn"
                className="w-full font-bold py-2.5 shadow-sm bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 rounded-lg transition-colors text-xs"
              >
                <MessageSquare className="w-4 h-4" /> CONTACT SALES ON WHATSAPP
              </a>
            ) : (
              <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Customer phone number is unavailable.</span>
              </div>
            )}
            <button
              type="button"
              disabled
              className="w-full font-bold py-2.5 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] opacity-60 cursor-not-allowed"
            >
              ONLINE PAYMENT — COMING SOON
            </button>
          </div>
        )}
      </div>

      {/* Asset Preview / Lightbox Modal */}
      <AssetPreviewModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}
