# ZOBBRA "Design & Order Online" — Customizer Architecture & Workflow Documentation

## 1. Executive Summary

The ZOBBRA Customizer provides a seamless, guest-first visual apparel customizer that integrates directly into the existing ZOBBRA business architecture. It allows any visitor to select a garment, choose from authentic catalog colors, design both front and back views with custom typography and uploaded logos, configure a detailed variant breakdown matrix (Color × Size), review live authoritative pricing (including volume tiers and GST), and convert their design into an official quotation or order.

---

## 2. The Customer Journey (Guest-First Flow)

```
[ HOME PAGE ]
  │
  ├─ "DESIGN & ORDER ONLINE" CTA
  ▼
[ PUBLIC CATALOG: /products ]
  │
  ├─ Real DB items with MOQ, starting prices, and color swatches
  ├─ Card Dual Actions: [ VIEW DETAILS ] and [ CUSTOMIZE ]
  ▼
[ PRODUCT DETAIL: /products/:id ]
  │
  ├─ Dual Actions: [ GET A QUICK QUOTE ] & [ DESIGN YOUR OWN → ]
  ▼
[ VISUAL CUSTOMIZER: /products/:id/customize ]
  │
  ├─ 1. Pick authentic catalog color (updates garment SVG live)
  ├─ 2. Front & Back dual canvas with Fabric.js
  ├─ 3. Add custom text (Google Fonts: Outfit, Inter, Roboto, etc.)
  ├─ 4. Upload logos/artwork via Cloudinary guest-signature
  ├─ 5. Layer ordering, alignment, color palette, font sizes
  ├─ 6. Enter total quantity & Variant Matrix (e.g. M: 50, L: 50)
  ├─ 7. Live pricing calculator (Volume tier + Print addon + 5% GST)
  │
  └─ Click [ PROCEED → ]
       │
       ├─ If AUTHENTICATED: Directly submits quote and redirects to /customer/quotes
       │
       └─ If GUEST:
            ├─ Exports front & back preview snapshots to Cloudinary
            ├─ Saves versioned draft to localStorage (`zobbra_customizer_draft_v1`)
            ├─ Redirects to /login?returnUrl=/products/:id/customize?resume=1
            │
            ▼
[ LOGIN / REGISTER PAGE ]
  │
  ├─ "You have a customized product waiting!" banner
  ├─ Validates returnUrl against open redirect vulnerabilities
  ├─ User signs in or creates account
  │
  ▼
[ RETURN TO CUSTOMIZER: /products/:id/customize?resume=1 ]
  │
  ├─ Detects authenticated customer
  ├─ Restores draft from localStorage (Canvas, colors, variants, pricing)
  ├─ Displays "Welcome back! Restored your custom design draft" notice
  ├─ Click [ SUBMIT OFFICIAL QUOTE REQUEST ]
  │
  ▼
[ EXISTING QUOTE → APPROVAL → ORDER PIPELINE ]
  │
  ├─ Admin reviews quote at /dashboard/quotes/:id with Front & Back preview cards
  ├─ Customer reviews quote at /customer/quotes with design thumbnail
  ├─ Approval & WhatsApp communication
  └─ Converted to Order with customization details and production job attachments
```

---

## 3. Key Components & Implementation

### 3.1. Fabric.js Canvas Studio (`CustomizerCanvas.tsx`)
- Located at `apps/web/src/components/customizer/CustomizerCanvas.tsx`.
- Dynamically imported with `{ ssr: false }` to avoid node-gyp `canvas.node` binary dependencies during Next.js server-side prerendering.
- Supports independent `frontCanvasJson` and `backCanvasJson` states, preserving full object vectors, scale, rotation, and layers across side toggles.
- Supports multi-object manipulation: alignment (center H/V), z-index (bring forward/send backward), typography (fonts, size, bold, italic, color, alignment), and logo upload.

### 3.2. Dynamic Garment Silhouette (`GarmentBackdrop.tsx`)
- Located at `apps/web/src/components/customizer/GarmentBackdrop.tsx`.
- Pure vector SVG rendering realistic garment silhouette with natural fabric lighting gradient and collar/sleeve contours.
- Color hex mapping (`getColorHex`) dynamically binds to real database variant colors.
- Provides subtle dashed printable area guidelines (30cm × 40cm).

### 3.3. Draft Persistence & Security (`customizerDraft.ts`)
- Located at `apps/web/src/lib/customizerDraft.ts`.
- Versioned storage under key `zobbra_customizer_draft_v1`.
- Excludes sensitive user credentials.
- `sanitizeReturnUrl`: Strictly validates return URLs against open redirects, rejecting external protocols (`http:`, `https:`, `//`, `javascript:`, `data:`).

### 3.4. Guest Cloudinary Upload Architecture (`/api/v1/media/guest-signature`)
- Endpoint `GET /api/v1/media/guest-signature` in `server/src/modules/media/media.controller.ts`.
- Scoped strictly to folder `zobbra/designs/`.
- Enables unauthenticated guests to upload logos and save rendered canvas previews without exposing backend API secrets.

### 3.5. Authoritative Pricing Engine
Matches `server/src/modules/quotes/quotes.controller.ts` formula:
- **Volume Tiers:**
  - $\ge 500$: $\max(100, \text{basePrice} - 60)$
  - $\ge 100$: $\max(120, \text{basePrice} - 30)$
  - $\ge 50$: $\max(140, \text{basePrice} - 10)$
- **Print Position Addon:**
  - Front Only: +₹20/unit
  - Back Only: +₹30/unit
  - Front & Back: +₹40/unit
- **GST:** 5% standard garment GST.

---

## 4. Admin & Production Workflow Integration

1. **Admin Quote Inspection:**
   - At `/dashboard/quotes/[id]`, the "Online Customizer Design Previews" card renders front and back preview cards alongside full order specifications and variant matrix.
2. **Order Conversion:**
   - In `server/src/modules/orders/orders.controller.ts`, converting a quote to an order transfers `customizationDetails` directly onto `OrderItem` and `ProductionJob` notes.
3. **Customer Portal:**
   - Customer can inspect active quotes and converted orders at `/customer/quotes` and `/customer/orders` with visual design thumbnails.
