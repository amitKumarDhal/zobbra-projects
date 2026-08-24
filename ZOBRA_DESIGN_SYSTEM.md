# ZOBRA DESIGN SYSTEM SPECIFICATION
**Version**: 2.0 (Canonical Production System)  
**Location**: `C:\Zobra\apps\web`  
**Primary Reference**: `DESIGN_SYSTEM_AUDIT.md`  

---

## 1. Principles

1. **One Design System**: The entire Zobra platform (Admin Dashboard, Customer Portal, Public Website, Authentication) shares a single, authoritative set of design tokens and components.
2. **B2B SaaS Aesthetic**: Modern, compact, clean, and high-density business interface optimized for rapid workflows.
3. **No Arbitrary Tokens**: Never introduce one-off hex colors, custom font sizes, or ad-hoc button designs. All UI must derive from the canonical tokens defined in `globals.css` and `tailwind.config.js`.

---

## 2. Typography System

| Token | Family | Weight | Size | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-xl` | Plus Jakarta Sans | 800 | 60px (3.75rem) | 1.1 | -0.025em | Hero Landing Banner |
| `display` | Plus Jakarta Sans | 800 | 48px (3.00rem) | 1.15 | -0.02em | Public Section Display |
| `h1` | Plus Jakarta Sans | 700 | 30px (1.875rem)| 1.2 | -0.015em | Admin Page Titles |
| `h2` | Plus Jakarta Sans | 700 | 18px (1.125rem)| 1.3 | Normal | Section Headers, Drawers |
| `h3` | Plus Jakarta Sans | 600 | 16px (1.00rem) | 1.4 | Normal | Card Titles, Panel Headers |
| `kpi` | Plus Jakarta Sans | 800 | 24px (1.50rem) | 1.2 | -0.01em | StatCard KPI Values |
| `body-lg` | Inter | 400 | 18px (1.125rem)| 1.6 | Normal | Lead Paragraphs |
| `body` | Inter | 400 | 15px (0.9375rem)| 1.5 | Normal | Default Body Text |
| `body-sm` | Inter | 400/500 | 14px (0.875rem) | 1.4 | Normal | Table Cells, Inputs, Buttons |
| `label` | Inter | 600 | 13px (0.8125rem)| 1.4 | Normal | Form Field Labels |
| `table-header`| Inter | 700 | 11px (0.6875rem)| 1.33 | 0.05em | Uppercase Table Headers |
| `badge` | Inter | 700 | 11px (0.6875rem)| 1.33 | 0.05em | Status / Category Badges |
| `mono` | JetBrains Mono | 600 | 14px (0.875rem) | 1.4 | Normal | Quote IDs, SKUs, GSTIN |

---

## 3. Canonical Color System

### Brand & Accents
- **`--color-brand-primary`**: `#3B6FEB` (Zobra Electric/Royal Blue — primary CTA, active nav, focus rings)
- **`--color-brand-hover`**: `#2563EB` (Primary hover)
- **`--color-brand-active`**: `#1D4ED8` (Primary active / click)
- **`--color-brand-soft`**: `#EEF2FF` (Soft blue badge background, icon containers)

### Neutrals & Surfaces
- **`--color-neutral-dark`**: `#111111` (Primary text, dark buttons, dark summary card)
- **`--color-surface-sidebar`**: `#0A0F1C` (Admin Sidebar background)
- **`--color-surface-black`**: `#050505` (Public topbar, Auth left panel)
- **`--color-bg-app`**: `#F8F9FC` (Application canvas background)
- **`--color-surface-card`**: `#FFFFFF` (White card container, table wrapper)
- **`--color-surface-subtle`**: `#F9FAFB` (Subtle input bg, drawer footer, table hover)

### Borders
- **`--color-border-default`**: `#E5E7EB` (Slate-200 — standard card & button borders)
- **`--color-border-strong`**: `#D1D5DB` (Slate-300 — form input borders)
- **`--color-border-subtle`**: `#F3F4F6` (Slate-100 — internal dividers)
- **`--color-border-focus`**: `#3B6FEB` (Brand blue focus ring)

### Semantic Status Matrix
| Status | Meaning | Text Color | Background Color | Border Color |
| :--- | :--- | :--- | :--- | :--- |
| **SUCCESS** | Approved, Active, Paid, Completed, Delivered | `text-emerald-700` (`#047857`) | `bg-emerald-50` (`#ECFDF5`) | `border-emerald-200` (`#A7F3D0`) |
| **WARNING** | Pending, Follow-up, Draft, Quoted, Partial | `text-amber-700` (`#B45309`) | `bg-amber-50` (`#FFFBEB`) | `border-amber-200` (`#FDE68A`) |
| **DANGER** | Rejected, Expired, Failed, Overdue, Cancelled | `text-rose-700` (`#BE123C`) | `bg-rose-50` (`#FFF1F2`) | `border-rose-200` (`#FECDD3`) |
| **INFO** | Sent, New, Contacted, In Progress, Processing | `text-blue-700` (`#1D4ED8`) | `bg-blue-50` (`#EFF6FF`) | `border-blue-200` (`#BFDBFE`) |
| **NEUTRAL** | Draft, Inactive, Archived, Refunded | `text-slate-700` (`#334155`) | `bg-slate-50` (`#F8FAFC`) | `border-slate-200` (`#E2E8F0`) |

---

## 4. Spacing & Density Scale

- **`space-1` (4px)**: Micro gaps, icon padding
- **`space-2` (8px)**: Badge padding (`px-2.5 py-0.5`), compact item gaps
- **`space-3` (12px)**: Form label margins, toolbar gaps (`gap-3`)
- **`space-4` (16px)**: StatCard padding (`p-4`), table cell padding (`p-4`), card gutters
- **`space-5` (20px)**: Button padding (`px-5 py-2.5`)
- **`space-6` (24px)**: Main card padding (`p-6`), section gaps (`space-y-6`)
- **`space-8` (32px)**: Modal dialog padding, sticky summary offset
- **`space-12` (48px)**: Page bottom padding (`pb-12`)

---

## 5. Border Radius Hierarchy

- **`6px` (`rounded-md`)**: Action icon buttons, small badges
- **`8px` (`rounded-lg`)**: Secondary action buttons, StatCard icon boxes
- **`12px` (`rounded-xl`)**: Form inputs, select dropdowns, StatCards, buttons
- **`16px` (`rounded-2xl`)**: Main content cards, data table wrappers, drawers, command palette
- **`24px` (`rounded-3xl`)**: Modal dialogs
- **`9999px` (`rounded-full`)**: Status badges, circular avatars, toggle pills

---

## 6. Shared Component Inventory

### `<Button />` (`@/components/ui/button`)
```tsx
<Button variant="primary">Create Quote</Button>
<Button variant="black">Export CSV</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
```

### `<StatCard />` (`@/components/ui/stat-card`)
```tsx
<StatCard
  icon={<Users className="w-5 h-5 text-purple-600" />}
  iconBg="bg-purple-50"
  title="Total Customers"
  value={stats.total}
  trend={12.3}
/>
```

### `<StatusBadge />` (`@/components/ui/status-badge`)
```tsx
<StatusBadge status="APPROVED" />
<StatusBadge status="PENDING" />
<StatusBadge status="EXPIRED" />
```

### `<Drawer />` (`@/components/ui/drawer`)
```tsx
<Drawer isOpen={isOpen} onClose={close} title="Quote Details" subtitle="ZQB-1024">
  <div>Content...</div>
</Drawer>
```

### `<Modal />` (`@/components/ui/modal`)
```tsx
<Modal isOpen={isOpen} onClose={close} title="Confirm Approval">
  <p>Modal body...</p>
</Modal>
```

### `<Input />` (`@/components/ui/input`)
```tsx
<Input placeholder="Enter customer name..." />
```

---

## 7. Developer Rules (DO NOT)

1. **DO NOT** create one-off inline hex colors (`text-[#...]`, `bg-[#...]`) for brand or status colors. Use design tokens.
2. **DO NOT** invent new button variants per page. Use `<Button variant="..." />`.
3. **DO NOT** copy-paste custom `StatCard` functions in dashboard pages. Import `<StatCard />` from `@/components/ui/stat-card`.
4. **DO NOT** write custom switch statements for status badge styling. Import `<StatusBadge />` from `@/components/ui/status-badge`.
5. **DO NOT** reintroduce legacy Terracotta (`#C75B39`), Deep Teal (`#1A5653`), or Gold (`#D4A953`) into active production UI.
