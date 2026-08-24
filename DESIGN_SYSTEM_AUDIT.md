# ZOBRA DESIGN SYSTEM AUDIT & CONSOLIDATION
**Author**: Principal UI Architect & Design Systems Engineer
**Project**: `C:\Zobra\apps\web`
**Date**: August 2026

---

## Executive Summary

A comprehensive source-code audit across the entire Zobra web application (`apps/web/src`) revealed a split between:
1. **Early Template / Prototype Tokens** (found in `tailwind.config.js`, `button.tsx`, `badge.tsx`, `input.tsx`, `customer/page.tsx`, and `design-system/page.tsx`):
   - Defined around an editorial/earthy palette (`#C75B39` Terracotta, `#1A5653` Deep Teal, `#D4A953` Gold, `#F7F5F2` Ivory, `#E7E3DD` Border).
2. **Active Production Zobra SaaS Design Language** (used across all 12 Admin Dashboard modules, Auth screens, Header/Footer, Create Quote, Quotes, Orders, Customers, Products, Settings, etc.):
   - Defined around a sleek modern B2B SaaS palette (`#3B6FEB` Zobra Royal/Electric Blue, `#111111` Deep Neutral, `#050505` / `#0A0F1C` Dark Surface, `#F8F9FC` App Background, `#E5E7EB` Slate Border, `#10B981` Emerald Success, `#F59E0B` Amber Warning, `#EF4444` Rose Danger).
   - Typography: Plus Jakarta Sans (`--font-heading`) for titles, Inter (`--font-sans`) for UI/inputs/tables/buttons, JetBrains Mono (`--font-mono`) for metrics/IDs.

This audit standardizes all disparate definitions into **ONE Centralized Design Token System** without breaking any existing business logic or layout structure.

---

## A. Typography Audit

| Hierarchy Level | Current Values Found in Code | Where Found | Recommended Central Token | Notes / Conflicts |
| :--- | :--- | :--- | :--- | :--- |
| **Heading Font** | `Plus_Jakarta_Sans` (`var(--font-heading)`) | `layout.tsx`, `globals.css`, all admin headers | `font-heading` (`var(--font-heading)`) | Used uniformly for headings |
| **Body / UI Font** | `Inter` (`var(--font-sans)`) | `layout.tsx`, `globals.css`, inputs, buttons, tables | `font-sans` (`var(--font-sans)`) | Primary workhorse UI font |
| **Monospace Font** | `JetBrains_Mono` (`var(--font-mono)`) | `layout.tsx`, `globals.css`, SKU codes, prices | `font-mono` (`var(--font-mono)`) | Financial numbers & IDs |
| **Legacy Font** | `font-serif` | `CustomerSidebar.tsx`, `login/page.tsx` (logo) | Migrate to `font-heading` | Resolves inconsistency |
| **Page Title (H1)** | `text-3xl font-heading font-black text-[#111111]` (30px) & `text-[28px]` | All admin pages (`quotes`, `orders`, `inquiries`, `settings`) | `text-3xl font-heading font-bold text-[#111111] tracking-tight` | Standardize weight to 700 (bold) |
| **Section Title (H2)** | `text-lg font-heading font-bold` (18px) | Drawers, create quote, settings cards | `text-lg font-heading font-bold text-[#111111]` | Consolidate 18px bold |
| **Card Title (H3)** | `text-base` / `text-xl font-heading font-bold` | Main cards, summary cards | `text-base md:text-lg font-heading font-bold text-[#111111]` | Clean card heading |
| **KPI Value** | `text-2xl font-heading font-black text-[#111111]` (24px) | `StatCard` in 10+ dashboard modules | `text-2xl font-heading font-black text-[#111111]` | Perfectly uniform |
| **Field Label** | `text-[13px]` / `text-sm font-semibold text-[#374151]` | Forms, Create Quote, Settings, Inquiries | `text-[13px] font-semibold text-[#374151]` | Natural Title Case |
| **Table Header** | `text-xs font-bold text-[#6B7280] uppercase tracking-wider` | All data tables | `text-xs font-bold text-[#6B7280] uppercase tracking-wider` | Uniform across tables |
| **Table Body Cell** | `text-sm font-semibold text-[#111111]` / `text-xs text-[#6B7280]` | All data tables | `text-sm font-medium text-[#111111]` | Clean tabular density |
| **Badge Text** | `text-[11px]` / `text-xs font-bold tracking-wide` | Status badges, category pills | `text-[11px] font-bold tracking-wide uppercase` | Crisp micro-label |

---

## B. Color Audit & Inventory

### 1. Brand & CTA Colors
| Token Name | Current Hex Found | Canonical Token | Usage |
| :--- | :--- | :--- | :--- |
| Primary CTA | `#3B6FEB` (Zobra Electric Blue) | `--color-brand-primary: #3B6FEB` | Primary buttons, active nav, focus rings, links |
| Primary Hover | `#2563EB` | `--color-brand-hover: #2563EB` | Hover states for primary actions |
| Primary Active | `#1D4ED8` | `--color-brand-active: #1D4ED8` | Click / active state |
| Primary Soft | `#EEF2FF` / `#EBF1FF` | `--color-brand-soft: #EEF2FF` | Active background pills, icon badges |

### 2. Neutrals & Surfaces
| Token Name | Current Hex Found | Canonical Token | Usage |
| :--- | :--- | :--- | :--- |
| Dark Neutral (Near Black) | `#111111` | `--color-neutral-dark: #111111` | Primary text, dark buttons, dark summary card |
| Deep Dark / Brand Header | `#050505` | `--color-surface-black: #050505` | Public topbar, auth brand side panel |
| Sidebar Background | `#0A0F1C` | `--color-surface-sidebar: #0A0F1C` | Admin Sidebar container |
| App Background | `#F8F9FC` | `--color-bg-app: #F8F9FC` | Admin layout background, public layout bg |
| Card Surface | `#FFFFFF` | `--color-surface-card: #FFFFFF` | Standard white cards, table containers |
| Subtle Surface | `#F9FAFB` | `--color-surface-subtle: #F9FAFB` | Input bg, drawer footer, table hover |
| Border Default | `#E5E7EB` | `--color-border-default: #E5E7EB` | Card borders, table dividers, button borders |
| Border Subtle | `#F3F4F6` | `--color-border-subtle: #F3F4F6` | Card header dividers |
| Border Strong | `#D1D5DB` | `--color-border-strong: #D1D5DB` | Form input borders |
| Text Primary | `#111111` | `--color-text-primary: #111111` | Main titles, values, high contrast text |
| Text Secondary | `#374151` | `--color-text-secondary: #374151` | Form labels, navigation items |
| Text Muted | `#6B7280` / `#9CA3AF` | `--color-text-muted: #6B7280` | Subtitles, placeholders, timestamps |

### 3. Semantic Status Colors
| Status / Meaning | Text Color | Background Color | Border Color | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `text-emerald-700` (`#047857`) | `bg-emerald-50` (`#ECFDF5`) | `border-emerald-200` (`#A7F3D0`) | Approved, Active, Paid, Completed, Delivered |
| **Warning / Pending** | `text-amber-700` (`#B45309`) | `bg-amber-50` (`#FFFBEB`) | `border-amber-200` (`#FDE68A`) | Pending, Follow-up, Due Soon, Quoted |
| **Danger / Destructive** | `text-rose-700` (`#BE123C`) | `bg-rose-50` (`#FFF1F2`) | `border-rose-200` (`#FECDD3`) | Rejected, Expired, Failed, Overdue, Cancelled |
| **Info / Sent** | `text-blue-700` (`#1D4ED8`) | `bg-blue-50` (`#EFF6FF`) | `border-blue-200` (`#BFDBFE`) | Sent, New Inquiry, Processing, Shipped |
| **Neutral / Draft** | `text-slate-700` (`#334155`) | `bg-slate-50` (`#F8FAFC`) | `border-slate-200` (`#E2E8F0`) | Draft, Inactive, Archived |

---

## C. Spacing & Density Scale

| Spacing Token | Pixels | Usage |
| :--- | :--- | :--- |
| `space-1` | 4px | Micro padding, icon gaps (`gap-1`) |
| `space-2` | 8px | Button icon spacing, badge padding (`px-2.5 py-1`) |
| `space-3` | 12px | Form label margins, compact gaps (`gap-3`) |
| `space-4` | 16px | StatCard padding, table cell padding (`p-4`) |
| `space-5` | 20px | Button padding (`px-5 py-2.5`) |
| `space-6` | 24px | Card padding, page section gaps (`p-6`, `space-y-6`) |
| `space-8` | 32px | Modal padding, sticky summary spacing |
| `space-12` | 48px | Page bottom padding (`pb-12`) |

---

## D. Border Radius System

| Token | Class | Value | Applied To |
| :--- | :--- | :--- | :--- |
| `radius-sm` | `rounded-md` | 6px | Action icons, tooltips |
| `radius-md` | `rounded-lg` | 8px | Action buttons, stat card icon boxes |
| `radius-lg` | `rounded-xl` | 12px | Form inputs, select dropdowns, stat cards, secondary buttons |
| `radius-xl` | `rounded-2xl` | 16px | Main content cards, table wrapper, summary card, drawer |
| `radius-2xl` | `rounded-3xl` | 24px | Modals, command palette |
| `radius-full` | `rounded-full` | 9999px | Status badges, circular avatars, toggle switches |

---

## E. Component Primitives Audit & Consolidation Plan

1. **`Button` (`apps/web/src/components/ui/button.tsx`)**:
   - **Current issue**: Defaults to legacy terracotta `#C75B39`.
   - **Fix**: Modernize variants: `primary` (Zobra Blue `#3B6FEB`), `black` (`#111111`), `secondary` (`bg-white border-[#E5E7EB]`), `outline`, `ghost`, `danger`. Maintain backward compatibility.

2. **`Badge` (`apps/web/src/components/ui/badge.tsx`)**:
   - **Current issue**: Contains legacy terracotta/deepteal/gold.
   - **Fix**: Update to semantic variants: `success`, `warning`, `danger`, `info`, `neutral`, `primary`.

3. **`Input` (`apps/web/src/components/ui/input.tsx`)**:
   - **Current issue**: Has hardcoded terracotta focus ring `#C75B39` and `#E7E3DD` border.
   - **Fix**: Standardize to `border-[#D1D5DB] focus:ring-[#3B6FEB]/40 focus:border-[#3B6FEB] text-[#111111]`.

4. **`Card` & `StatCard` (`apps/web/src/components/ui/card.tsx` & `StatCard.tsx`)**:
   - **Current issue**: Every dashboard page (`quotes`, `inquiries`, `orders`, `customers`, `products`, `todo`, `payments`, `coupons`, `agents`) replicates its own `function StatCard(...)`.
   - **Fix**: Create a canonical reusable `StatCard` component in `apps/web/src/components/ui/stat-card.tsx`.

5. **`StatusBadge` Component (`apps/web/src/components/ui/status-badge.tsx`)**:
   - **Current issue**: Every page writes its own switch statement for status colors.
   - **Fix**: Centralize all statuses (`QuoteStatus`, `OrderStatus`, `PaymentStatus`, `InquiryStatus`, `CouponStatus`, `TaskStatus`) into one authoritative `StatusBadge` component.

6. **`Drawer` & `Modal` (`apps/web/src/components/ui/drawer.tsx` & `modal.tsx`)**:
   - **Current issue**: Right-side drawers are rewritten inline in multiple pages.
   - **Fix**: Provide a shared `Drawer` wrapper with standardized backdrop, header, body, footer, and animation.

7. **Showcase Page (`/design-system`)**:
   - **Current issue**: Displays old prototype colors (terracotta/deepteal).
   - **Fix**: Upgrade `/design-system` into an interactive, live showcase of the canonical ZOBBRA B2B SaaS tokens and components.
