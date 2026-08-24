# ZOBBRA CUSTOMER PORTAL — DESIGN SYSTEM AUDIT

**Date**: August 21, 2026  
**Auditor**: Principal UI Architect + Design Systems Engineer  
**Scope**: Complete Customer Portal (`/customer/*`) and shared customer components  
**Single Source of Truth**: `c:\Zobra\DESIGN_SYSTEM_AUDIT.md` & `c:\Zobra\ZOBBRA_DESIGN_SYSTEM.md`  

---

## 1. Executive Summary

The ZOBBRA Customer Portal routes were audited against the canonical ZOBBRA Design System established in `DESIGN_SYSTEM_AUDIT.md`. 

While the Customer Portal had functional backend integrations (real quotes, products, orders, Razorpay payments, and PostgreSQL persistence), the visual presentation was heavily contaminated with legacy prototype styles:
- Legacy background `#F7F5F2` (Warm Ivory) across all customer pages.
- Legacy text `#1C1C1C` and muted `#5F6368`.
- Legacy prototype colors: Terracotta `#C75B39`, Deep Teal `#1A5653`, Luxury Gold `#D4A953`.
- Legacy borders `#E7E3DD`.
- Serif typography (`font-serif`) on headings, prices, and cards instead of canonical Plus Jakarta Sans (`font-heading`) and Inter (`font-sans`).
- Duplicate local KPI cards instead of canonical `@/components/ui/stat-card`.
- Ad-hoc badge styling instead of canonical `@/components/ui/status-badge`.

---

## 2. Comprehensive Per-Route Audit

### 1. Customer Layout (`/customer/layout.tsx`)
- **Current State**: Used `bg-[#F7F5F2]` and `text-[#1C1C1C]`.
- **Target Canonical State**: `bg-[#F8F9FC] text-[#111111] font-sans`.

### 2. Customer Sidebar (`CustomerSidebar.tsx`)
- **Current State**: Already updated to `#0A0F1C` dark background and `#3B6FEB` active pill, but only had 3 navigation items (`Dashboard`, `Products`, `My Quotes`).
- **Target Canonical State**: Complete 10 customer navigation items: `Dashboard`, `Products`, `Create Quote`, `My Quotes`, `My Orders`, `Shipment Tracking`, `Invoices`, `Notifications`, `Support`, `Profile`.

### 3. Customer Dashboard (`/customer/page.tsx`)
- **Current State**: Used `font-serif`, `bg-[#F7F5F2]`, local KPI cards with hardcoded `#1A5653`, `#C75B39`, `Badge variant="terracotta"`, `Button variant="terracotta"`, `#E7E3DD` borders.
- **Target Canonical State**: Use canonical `StatCard` (`@/components/ui/stat-card`), `StatusBadge` (`@/components/ui/status-badge`), `Button variant="primary"`, `Button variant="outline"`, `font-heading font-black text-[#111111]` for company heading, and `border-[#E5E7EB]`.

### 4. Product Catalog & Customizer (`/customer/products/page.tsx`)
- **Current State**: Used `#F7F5F2`, `#1C1C1C`, `#E7E3DD`, `variant="terracotta"`, `variant="gold"`, `bg-[#1A5653]` for live estimate panel, `font-serif`.
- **Target Canonical State**: Canonical product card with `border-[#E5E7EB]`, `font-heading` product title, `font-mono` JetBrains Mono price, `Button variant="primary"`, category tabs with `#3B6FEB` active state, and `#0A0F1C` estimate panel with `#3B6FEB` accents.

### 5. Create Quote Wizard (`/customer/create-quote/page.tsx`)
- **Current State**: Used `#F7F5F2`, `#1A5653`, `#C75B39`, `#D4A953`, `variant="terracotta"`, `variant="gold"`.
- **Target Canonical State**: 8-step progress bar using canonical `#3B6FEB` (current/active), `#047857` (completed), `#F3F4F6` (upcoming); form pills using `#EEF2FF` and `#3B6FEB`; dark summary card using `#0A0F1C`; `Button variant="primary"`.

### 6. Customer Quotes (`/customer/quotes/page.tsx`)
- **Current State**: Table used `font-serif` heading, `#1A5653` quote ID, `#C75B39` price, and arbitrary `Badge variant`.
- **Target Canonical State**: Canonical `StatusBadge` mapped to backend statuses (`DRAFT`, `SENT`, `APPROVED`, `REJECTED`, `EXPIRED`), JetBrains Mono (`font-mono`) quote numbers and prices, `Button variant="primary"` for order conversion.

### 7. Customer Orders (`/customer/orders/page.tsx`)
- **Current State**: Used `#F7F5F2`, `font-serif`, `variant="terracotta"`.
- **Target Canonical State**: Canonical `StatusBadge` for both Order Status and Payment Status, `font-mono` for order numbers and totals, `border-[#E5E7EB]`.

### 8. Customer Order Detail (`/customer/orders/[id]/page.tsx`)
- **Current State**: Used `#1A5653` for Razorpay theme & Pay button, `#C75B39` price, `font-serif` titles.
- **Target Canonical State**: Canonical `#3B6FEB` primary Pay button, `StatusBadge` for order status, payment status, and payment audit log items, `font-mono` for currency and IDs.

### 9. Shipment Tracking (`/customer/tracking/page.tsx`)
- **Current State**: Used `#1A5653`, `#D4A953`, `#C75B39`, `font-serif`.
- **Target Canonical State**: Canonical `#3B6FEB` for completed tracking milestones, `border-[#E5E7EB]`, `font-heading font-black` title.

### 10. Customer Invoices (`/customer/invoices/page.tsx`)
- **Current State**: Used `#1A5653`, `#C75B39`, `font-serif`, `variant="terracotta"`.
- **Target Canonical State**: Canonical `StatusBadge`, `font-mono` for invoice numbers and GST figures, `Button variant="outline"` for PDF download.

### 11. Customer Notifications (`/customer/notifications/page.tsx`)
- **Current State**: Used `#1A5653`, `#C75B39`, `font-serif`.
- **Target Canonical State**: Canonical category filter tabs with `#3B6FEB` active pill, `#3B6FEB` unread badge, `border-[#E5E7EB]`.

### 12. Customer Support (`/customer/support/page.tsx`)
- **Current State**: Used `#1A5653`, `#C75B39`, `font-serif`, `variant="terracotta"`.
- **Target Canonical State**: Canonical `StatusBadge` for ticket statuses (`Open`, `Resolved`), `font-heading` for title, `Button variant="primary"`.

### 13. Customer Profile (`/customer/profile/page.tsx`)
- **Current State**: Used `#1A5653`, `#C75B39`, `font-serif`, `variant="terracotta"`.
- **Target Canonical State**: Canonical input styling with `#D1D5DB` borders and `#3B6FEB` focus ring, `Button variant="primary"`.

### 14. Payment Success & Failed (`/customer/payment/success/` & `failed/`)
- **Current State**: Used `font-serif`, `#1A5653`, `#C75B39`, `variant="terracotta"`.
- **Target Canonical State**: Canonical typography (`font-heading`), `font-mono` payment IDs and amounts, `Button variant="primary"`.

---

## 3. Consolidation Action Plan

1. **Layout & Navigation**: Update `CustomerLayout` background and expand `CustomerSidebar` to full 10-item menu.
2. **Dashboard**: Wire canonical `StatCard` and `StatusBadge`.
3. **Product Catalog & Wizard**: Standardize product cards, modal customizers, and 8-step configurator to canonical tokens.
4. **Quotes & Orders**: Standardize tables, status badges, order detail view, and Razorpay triggers.
5. **Auxiliary Modules**: Tracking, Invoices, Notifications, Support, Profile, and Payment callbacks.
6. **Design System Showcase**: Add dedicated Customer Portal section to `/design-system`.
7. **Quality & Testing**: Cypress E2E test suite + Vitest + Next.js build validation.
