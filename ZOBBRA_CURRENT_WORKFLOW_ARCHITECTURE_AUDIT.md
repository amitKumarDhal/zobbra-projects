# ZOBBRA CURRENT WORKFLOW ARCHITECTURE AUDIT
**Document Version:** 1.0.0  
**Date:** September 19, 2026  
**Auditor:** Lead Product Architect & Senior Systems Engineering Team  
**Repository:** `c:\Zobra` (Branch: `main`)  
**Scope:** Complete Architectural Discovery & Baseline Audit of ZOBBRA B2B SaaS Application

---

## 1. Executive Summary

ZOBBRA is a specialized B2B custom merchandise manufacturing and procurement platform tailored for corporate, enterprise, and institutional apparel/gifting. The system operates on a hybrid B2B model accommodating two distinct client intake funnels:
1. **Public/Guest Inquiries & Mockup Requests:** Low-friction intake capturing contact details, category interest, target quantity, print positions, optional color/size breakdowns, and artwork/reference files.
2. **Authenticated B2B Corporate Portal:** Full self-service quotation building, company profile linkage, quotation approval/rejection, instant conversion from approved quotation to production orders, automated PDF invoice generation, and Razorpay payment processing.

### Key Architectural Strengths:
- **Clean Relational Isolation:** Corporate entities (`Company`), user accounts (`User`), intake leads (`Inquiry`), commercial contracts (`Quote`), execution contracts (`Order`), shop-floor operations (`ProductionJob`), fulfillment (`Dispatch`), and tax accounting (`Invoice`) are modeled in PostgreSQL via Prisma with foreign key integrity.
- **Server-Side Pricing Authority:** Pricing is strictly computed on the backend (`calculateServerPricing`). Volume discount curves (discounts at 50, 100, 500 units), print position surcharges (Front Only +₹20, Front & Back +₹40, Embroidery +₹30), and statutory GST calculations are server-enforced, preventing client-side price tampering.
- **Atomic State Transitions:** Inquiries convert to Quotes transactionally; Quotes convert to Orders atomically while auto-generating production jobs, commercial invoices, and closing linked inquiries.
- **Native 2D Variant Breakdown:** The schema already possesses native relational variant tables (`InquiryVariant`, `QuoteItemVariant`, `OrderItemVariant`) supporting color × size × quantity matrices.

### Primary Architectural Gaps Identified for Future Customizer Integration:
- **No Native Design State Model:** There is currently no `Design` or `Artwork` entity. Customization is either stored as flat strings (`printPosition`, `printingType`, `colors`, `sizes`, `customizationRequirements`), unstructured text (`OrderItem.customizationDetails`), or Cloudinary asset URLs (`Inquiry.artworkUrl`).
- **QuoteItem Lacks Customization Field:** While `OrderItem` has `customizationDetails String?`, `QuoteItem` lacks this field. Customization requirements on Quotes are presently stuffed into `Quote.notes` as delimited strings.
- **Guest Cloudinary Signature Guard:** `GET /api/v1/media/signature` requires `authenticateJWT` with roles `ADMIN`, `SALES`, or `CUSTOMER`. Guest visitors submitting artwork on the public form cannot obtain an authorized signature unless a public/guest signing mechanism is enabled.
- **Single-Item Assumption in Admin Quote Editor:** `apps/web/src/app/dashboard/quotes/[id]/page.tsx` directly modifies `quote.items[0]`, assuming single-line custom quotes. Multi-item quotes require expanded UI support.

---

## 2. Repository Architecture & Directory Tree

The codebase is organized as a Turborepo monorepo with `pnpm` workspaces (package manager `pnpm@10.0.0`):

```
c:\Zobra\
├── apps\
│   ├── web\                          # Next.js 14.2 App Router Frontend (Port 3000)
│   │   ├── cypress\                  # 42 End-to-End Cypress test suites
│   │   │   ├── e2e\                  # Complete journey & regression test coverage
│   │   │   └── support\              # Commands & login helpers
│   │   ├── src\
│   │   │   ├── app\
│   │   │   │   ├── (auth)\           # Login, Register, Forgot/Reset Password
│   │   │   │   ├── (public)\         # Homepage, /get-quote, /products, /products/[id]
│   │   │   │   ├── customer\         # Customer Portal (/quotes, /orders, /invoices, /payment)
│   │   │   │   └── dashboard\        # Admin/Sales Desk (/inquiries, /quotes, /orders, /customers)
│   │   │   ├── components\
│   │   │   │   ├── landing\          # Public marketing & hero components
│   │   │   │   ├── shared\           # SimplifiedQuoteForm, VariantBreakdownEntry
│   │   │   │   └── ui\               # Design system primitives (Button, Card, Modal, Badges)
│   │   │   ├── hooks\                # Auth & sidebar state management hooks
│   │   │   └── lib\                  # API client, Cloudinary uploader, WhatsApp generator
│   └── mobile\                       # Mobile application workspace (placeholder)
├── packages\
│   ├── api\                          # Shared API definitions and contracts
│   ├── database\                     # Prisma database schema & seeds
│   └── shared\                       # Common utilities and TypeScript interfaces
├── prisma\
│   ├── schema.prisma                 # Authoritative PostgreSQL Prisma Schema (704 lines)
│   ├── migrations\                   # Baseline SQL migration history
│   ├── seed.ts                       # Standard development seed data
│   └── seed_staging.ts               # Production-grade staging dataset
├── server\                           # Express 4.22 + TypeScript REST API Backend (Port 5000)
│   ├── src\
│   │   ├── app.ts                    # Express bootstrap, CORS, Route registration
│   │   ├── config\                   # Env variables, Prisma client, Cloudinary, autoMigrate
│   │   ├── middleware\               # JWT Auth, Role Authorization, Error Handling
│   │   ├── modules\
│   │   │   ├── auth\                 # Login, register, getMe, password reset
│   │   │   ├── customers\            # B2B Company management, CRM stats, soft-deletes
│   │   │   ├── dispatch\             # Shipment creation, courier tracking
│   │   │   ├── inquiries\            # Guest/Customer inquiry intake & conversion
│   │   │   ├── invoices\             # Tax invoice generation, PDF streaming
│   │   │   ├── media\                # Cloudinary cryptographic signature & deletion
│   │   │   ├── orders\               # Order state machine, Quote -> Order conversion
│   │   │   ├── payments\             # Razorpay order generation & HMAC-SHA256 signature verification
│   │   │   ├── production\           # Kanban shop-floor tracking (5 stages)
│   │   │   ├── products\             # Catalog, Category, BulkPricing, Variants
│   │   │   └── quotes\               # Quote calculation, PDF generator, WhatsApp dispatch
│   │   └── utils\                    # PDF generator (PDFKit), WhatsApp templates, Email
│   └── tests\                        # Jest/Supertest backend integration tests
├── pnpm-workspace.yaml               # Workspace configuration
└── turbo.json                        # Turborepo pipeline configuration
```

---

## 3. Roles & Authentication Implementation

### 3.1 Role Definitions
Defined in `prisma/schema.prisma` via `enum Role`:
- `ADMIN`: Full unrestricted access to all dashboard management modules, customers, quotes, orders, production, finance, CMS, and system activities.
- `SALES`: Customer intake, inquiry review, quote generation/editing, price overrides, customer communications via WhatsApp/Email.
- `PRODUCTION`: Factory and manufacturing view; manages `ProductionJob` Kanban boards (PRINTING, QUALITY_CHECK, PACKING, READY_TO_DISPATCH).
- `CUSTOMER`: Client portal user; views own quotes, orders, shipments, invoices, approves quotes, initiates payments, and submits inquiries.
- `GUEST`: Unauthenticated public visitor; can submit inquiries on `/get-quote` without an active session.

### 3.2 Identity Establishment & Token Structure
- **Token Type:** JSON Web Token (JWT), signed using `config.jwtSecret` with configurable expiry (`config.jwtExpiresIn`, default `7d`).
- **Token Payload:**
  ```json
  {
    "id": "uuid-of-user",
    "email": "corporate.contact@acme.com",
    "role": "CUSTOMER",
    "companyId": "uuid-of-company"
  }
  ```
- **Storage:** Frontend persists the JWT in `localStorage` under keys `'token'` and `'zobra_token'`.
- **Transmission:** Sent via HTTP header: `Authorization: Bearer <token>`.

### 3.3 Backend Middleware Execution
File: `server/src/middleware/auth.ts`
1. `authenticateJWT`: Validates `Bearer` token header. Decodes JWT and assigns to `req.user`. Returns 401 if missing, 403 if invalid/expired.
2. `optionalAuth`: Extracts token if present; silently ignores errors if missing, allowing guest access while identifying logged-in users.
3. `authorizeRoles(...roles)`: Verifies `req.user.role` matches allowed roles. Returns 403 if unauthorized.

### 3.4 Ownership Enforcement (Customer vs Admin Distinction)
The system enforces strict row-level security:
```typescript
// Quotes ownership guard (server/src/modules/quotes/quotes.controller.ts)
if (req.user?.role === 'CUSTOMER') {
  where.AND = [
    {
      OR: [
        { customerId: req.user.id },
        { companyId: req.user.companyId || undefined },
      ]
    }
  ];
}
```
**CRITICAL ISOLATION RULE:** Admin screens display customer information fetched directly from the record relation:
- Quote customer: `quote.customer.name`, `quote.customer.email`, `quote.customer.phone`
- Quote company: `quote.company.name`, `quote.company.gstin`
- Inquiry customer: `inquiry.customerName || inquiry.customer.name`
The current admin session (`req.user`) is NEVER displayed as customer data. `req.user` is only used to populate `userId` in audit trails (`QuoteActivity`, `InquiryActivity`, `SystemActivity`).

---

## 4. Customer & Company Profile Model

### 4.1 Schema Relationship
```
┌─────────────────────────┐         ┌─────────────────────────┐
│         Company         │ 1     * │          User           │
│─────────────────────────│─────────│─────────────────────────│
│ id (UUID PK)            │         │ id (UUID PK)            │
│ name (Corporate Name)   │         │ email (Unique)          │
│ gstin (Tax ID, Unique)  │         │ passwordHash            │
│ address, city, state    │         │ name (Contact Person)   │
│ pincode, logo, notes    │         │ phone                   │
│ isActive (Boolean)      │         │ role (CUSTOMER/ADMIN)   │
└─────────────────────────┘         │ companyId (FK Nullable) │
                                    └─────────────────────────┘
```

### 4.2 Entity Field Ownership Matrix

| Field | User Model | Company Model | Inquiry Model | Quote Model | Order Model |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Contact Name** | `name` | — | `customerName` | via `customer` | via `customer` |
| **Contact Phone** | `phone` | — | `phone` | via `customer` | via `customer` |
| **Contact Email** | `email` | — | `email` | via `customer` | via `customer` |
| **Company Legal Name** | — | `name` | `companyName` | via `company` | via `company` |
| **GSTIN (Tax ID)** | — | `gstin` | — | via `company` | via `company` |
| **Billing Address** | — | `address`, `city`, `state`, `pincode` | `location` | via `company` | via `company` |
| **Customer Type** | `role` | — | `customerType` | — | — |

**Source of Truth Principles:**
- Admin viewing Customer: Display `company.name` + `company.users[]`.
- Admin viewing Quote: Display `quote.customer` (individual) and `quote.company` (B2B entity).
- Admin viewing Order: Display `order.customer` and `order.company`.
- Admin viewing Inquiry: Display `inquiry.customerName`, fallback to `inquiry.customer.name`. Display `inquiry.phone`, fallback to `inquiry.customer.phone`.

---

## 5. Public / Guest Quote Intake Flow (Flow A)

### 5.1 Journey Step-by-Step
1. **User Entry:** Visitor arrives on `https://zobbra.com/get-quote`.
2. **Form Render:** `apps/web/src/app/(public)/get-quote/page.tsx` renders `SimplifiedQuoteForm.tsx` (`isCustomer={false}`).
3. **Product Catalog Fetch:** Form fetches `GET /api/v1/products?status=ACTIVE` to populate category/product dropdown.
4. **Form Inputs:**
   - Name (`required`)
   - Phone (`required`, Indian mobile)
   - Product Category (`optional`, dropdown: T-Shirt, Cap, Bag, Welcome Kit)
   - Quantity (`required`, default: 100, min: 1)
   - Size / Colour Breakdown (`optional`, collapsible matrix via `VariantBreakdownEntry.tsx`)
   - Print Position (`optional`, buttons: Front, Back, Both, or Clear)
   - Reference Files / Mockup (`optional`, drag-and-drop file upload)
5. **Form Submission:**
   - Because `isCustomer = false`, endpoint target is `POST /api/v1/inquiries`.
   - **Payload Sent:**
     ```json
     {
       "name": "Anil Verma",
       "phone": "+91 98765 43210",
       "productId": "polo-200gsm-id",
       "productCategory": undefined,
       "quantity": 100,
       "printPosition": "Front",
       "referenceFiles": ["https://res.cloudinary.com/demo/image/upload/v1/zobbra/art1.png"],
       "source": "WEBSITE",
       "variants": [
         { "color": "Navy Blue", "size": "L", "quantity": 60 },
         { "color": "Navy Blue", "size": "XL", "quantity": 40 }
       ]
     }
     ```
6. **Backend Controller Processing:** `InquiryController.create` in `server/src/modules/inquiries/inquiries.controller.ts`:
   - Validates `customerName`, `phone`, `quantity > 0`.
   - Normalizes artwork URLs: `finalArtworkUrl = referenceFiles.join(', ')`.
   - Generates unique inquiry number: `INQ-YYYY-XXXX` (e.g., `INQ-2026-0042`).
   - Sets `customerType = 'GUEST'`.
   - Creates `Inquiry` record and `InquiryVariant` child records in a Prisma transaction.
   - Creates `InquiryActivity` with type `CREATED`.
7. **Success State:** Form displays checkmark banner with unique inquiry number (`INQ-2026-0042`).

---

## 6. Logged-in Customer Request Flow (Flow B)

### 6.1 Route: `/customer/create-quote`
- Component: `apps/web/src/app/customer/create-quote/page.tsx`
- Form: Reuses `SimplifiedQuoteForm` with `isCustomer={true}` and pre-fills `name` and `phone` from `useCustomerUser()`.
- Auth Header: Attached automatically via `localStorage.getItem('token')`.

### 6.2 Submission Logic Differences
```typescript
// apps/web/src/components/shared/SimplifiedQuoteForm.tsx
const isMockupOnly = !resolvedProductId;
const endpoint = isMockupOnly ? '/inquiries' : (isCustomer ? '/quotes' : '/inquiries');
```
1. **Mockup-Only Request (No Product ID):** Submits to `POST /api/v1/inquiries`.
   - Backend links `customerId = req.user.id`, `companyId = req.user.companyId`.
   - Sets `customerType = 'REGISTERED'`.
2. **Standard Product Quote:** Submits directly to `POST /api/v1/quotes`.
   - Backend computes authoritative pricing using `calculateServerPricing`.
   - Generates `Quote` with status `DRAFT`.
   - Generates `QuoteItem` and `QuoteItemVariant` records.
   - Redirects customer to `/customer/quotes` after 2.5 seconds.

### 6.3 Flow Comparison: Guest vs Logged-In Customer

| Parameter | Guest (`/get-quote`) | Logged-In Customer (`/customer/create-quote`) |
| :--- | :--- | :--- |
| **API Endpoint** | `POST /api/v1/inquiries` | `POST /api/v1/quotes` (or `/inquiries` if mockup only) |
| **Authentication** | None (Unauthenticated) | Bearer JWT Header |
| **Customer ID** | `null` | `req.user.id` |
| **Company ID** | `null` | `req.user.companyId` |
| **Database Entity** | `Inquiry` + `InquiryVariant` | `Quote` + `QuoteItem` + `QuoteItemVariant` |
| **Initial Status** | `InquiryStatus.NEW` | `QuoteStatus.DRAFT` |
| **Post-Submission** | In-page success banner with `INQ-` code | Auto-redirects to `/customer/quotes` portal |

---

## 7. Inquiry Lifecycle & Inquiry → Quote Conversion

### 7.1 Complete Inquiry State Machine
Enums defined in `InquiryStatus`:
```
NEW ──► CONTACTED ──► FOLLOW_UP ──► QUOTED ──► CONVERTED ──► CLOSED
 │          │              │                       ▲
 └──────────┴──────────────┴──────► LOST           │
                                                   │
(Admin clicks "Convert to Quote" ──────────────────┘)
```

### 7.2 What Exactly Happens During "Convert to Quote"?
Endpoint: `POST /api/v1/inquiries/:id/convert-to-quote`  
Executed by `InquiryService.convertToQuote(inquiryId, userId)` in an atomic Prisma transaction (`server/src/modules/inquiries/inquiries.service.ts` L275–L459):

1. **Guest-to-Customer Auto-Provisioning:**
   - If `inquiry.customerType === 'GUEST'` and `customerId` is null:
   - Derives email: uses `inquiry.email` or generates placeholder `guest-<phone>@zobbra.guest`.
   - Creates a new `User` record with `role: 'CUSTOMER'`, `passwordHash: 'GENERATED_NO_PASSWORD'`, `isActive: true`.
   - Updates `inquiry.customerId` and sets `customerType = 'REGISTERED'`.
2. **Quote Generation:**
   - Generates sequential quote number: `ZQB-YYYY-XXXX` (e.g., `ZQB-2026-1045`).
   - Sets `validUntil = now + 7 days`.
   - Sets initial status to `DRAFT`.
3. **Product & Pricing Resolution:**
   - Matches product via `inquiry.productId` or text search on `inquiry.productInterest`.
   - Fallback to catalog default if unspecified.
   - Applies volume pricing curve:
     - Quantity >= 500: basePrice - ₹60 (floor ₹100)
     - Quantity >= 100: basePrice - ₹30 (floor ₹120)
     - Quantity >= 50: basePrice - ₹10 (floor ₹140)
   - Applies print position surcharge: Front & Back (+₹40), Embroidery/Back (+₹30), Front Only (+₹20).
   - Computes GST: `Math.round(amount * (product.gstRate / 100))`.
4. **Child Records Created:**
   - Creates `QuoteItem` with `unitPrice`, `totalPrice`, `printType`, `color`, `size`.
   - Copies all `inquiry.variants` into `QuoteItemVariant` (`color`, `size`, `quantity`).
   - Updates `Quote` subtotal, gstTotal, and totalAmount.
5. **Inquiry Mutation & Activity Logging:**
   - Updates `inquiry.status = 'CONVERTED'`, sets `inquiry.quoteId = quote.id`.
   - Creates `InquiryActivity` (`QUOTE_CREATED`).
   - Creates `QuoteActivity` (`NOTE`).
6. **Automatic Inquiry Filtering:** Inquiries whose linked quotes have orders are automatically hidden from `/dashboard/inquiries` by `InquiryService.getAllInquiries`.

---

## 8. Admin Inquiry UI & Data Mapping Audit

File: `apps/web/src/app/dashboard/inquiries/page.tsx`

### 8.1 Table Presentation & Expansion
- Clicking an inquiry row triggers downward expansion (`isExpanded && detail`).
- **Columns:** Inquiry ID, Customer Name + Badge (`REGISTERED` vs `INDIVIDUAL / GUEST`), Product Interested, Source (Website, WhatsApp, Call, Instagram), Date & Time, Status Badge, Assigned Sales Rep, Actions.

### 8.2 Field Mapping & Fallback Audit

| Display Element | Primary Source | Fallback Source | Risk Assessment |
| :--- | :--- | :--- | :--- |
| **Customer Name** | `inq.customerName` | `inq.customer?.name` | **SAFE**: Real user or guest name |
| **Customer Phone** | `inq.phone` | `inq.customer?.phone` | **SAFE**: Real contact number |
| **Customer Email** | `detail.email` | None (omitted if null) | **SAFE**: Does NOT leak admin email |
| **Company** | `detail.companyName` | `detail.company?.name` | **SAFE**: Corporate or Individual |
| **Product** | `detail.product?.name` | `detail.productInterest` | **SAFE**: Preserves public selection |
| **Print Position** | `detail.printPosition` | `'Not provided'` | **SAFE**: Cleaned, no fake defaults |
| **Artwork URLs** | `detail.artworkUrl` | Split by comma, PDF/IMG | **SAFE**: Cloudinary secure URLs |

---

## 9. Product Catalog & Variant Data Models

### 9.1 Schema Fields on `Product` Model
Prisma Model: `Product` (`prisma/schema.prisma` L211–L236)
- `id`: String (UUID PK)
- `name`: String
- `slug`: String (Unique)
- `hsnCode`: String (Default: `"6109"`)
- `gstRate`: Float (Default: `5.0`)
- `description`: String
- `basePrice`: Float
- `images`: String[] (Array of Cloudinary/CDN image URLs)
- `categoryId`: String (FK -> `Category`)
- `isActive`: Boolean (Default: `true`)
- `requiresColor`: Boolean (Default: `true`)
- `requiresSize`: Boolean (Default: `true`)
- `supportsVariantMatrix`: Boolean (Default: `true`)

### 9.2 Subordinate Models on Product
1. **`BulkPricing`** (`prisma/schema.prisma` L252–L264):
   - `productId`: String
   - `minQuantity`: Int
   - `maxQuantity`: Int
   - `pricePerUnit`: Float
   - `printType`: String (Default: `"Front Only"`)
2. **`ProductVariant`** (`prisma/schema.prisma` L238–L250):
   - `productId`: String
   - `color`: String
   - `size`: String
   - `sku`: String (Unique)
   - `stock`: Int (Default: `0`)

---

## 10. Public Product Detail Flow (`/products/[id]`)

File: `apps/web/src/app/(public)/products/[id]/page.tsx`
- **Gallery:** Displays large featured image + thumbnail carousel (`product.images[]`).
- **Options Displayed:**
  - Color swatches derived dynamically from `product.variants` (`uniqueColors`).
  - Size buttons derived dynamically from `product.variants` (`uniqueSizes`).
  - Tiered B2B Volume Pricing table derived from `product.bulkPricing`.
  - Live Estimate calculator updating dynamically with quantity slider.
- **Action Button:** "START QUOTE CONFIGURATOR"
- **Current Action Destination:**
  ```typescript
  <Link href={`/get-quote?product=${encodeURIComponent(product.name)}&qty=${qty}&color=${encodeURIComponent(selectedColor)}&size=${encodeURIComponent(selectedSize)}&id=${product.id}`}>
  ```
- **Customizer Gap:** The page currently has NO "Customize" or "Design Your Own" canvas view. It redirects into the simplified text quote configurator.

---

## 11. Existing Customization System Audit

A full ripgrep scan of the codebase was conducted for canvas, SVG, fabric, and image manipulation libraries:
- `Fabric.js`: **NOT INSTALLED / NOT PRESENT**.
- `Konva / react-konva`: **NOT INSTALLED / NOT PRESENT**.
- `HTML5 Canvas / Three.js`: **NOT PRESENT**.
- `SVG Editor / Layer System`: **NOT PRESENT**.
- **Existing Customization Storage:**
  - `OrderItem.customizationDetails`: String column (e.g., text descriptions).
  - `Inquiry.artworkUrl`: String containing comma-delimited Cloudinary URLs.
  - `Quote.notes`: Concatenated pipe-delimited string of specifications (`Fabric: Cotton | Print: Front - Embroidery | Artwork: https://...`).
- **Conclusion:** Customizer functionality is 100% greenfield. There are no legacy canvas components or conflicting visual editor dependencies in the active codebase.

---

## 12. Quote Workflow & State Machine

### 12.1 State Transitions
Enums defined in `QuoteStatus` (`server/src/modules/quotes/quotes.controller.ts` L43–L49):
```
DRAFT ──────► SENT ──────► APPROVED ──────► EXPIRED
  │            │              │
  ▼            ▼              ▼
REJECTED ◄─────┴──────────────┴── (Customer Rejects)
  │
  └──────────► DRAFT (Admin resets/revises)
```
- `DRAFT`: Newly converted from inquiry or created by sales rep. Only editable in DRAFT/SENT.
- `SENT`: Delivered to customer via WhatsApp or Email.
- `APPROVED`: Customer accepted price. Locked. Eligible for Order conversion.
- `REJECTED`: Customer declined. Can be revised back to DRAFT.
- `EXPIRED`: Past `validUntil` date.

### 12.2 Server-Authoritative Pricing Algorithm
`calculateServerPricing` (`server/src/modules/quotes/quotes.controller.ts` L9–L40):
```typescript
let positionAddon = 20;
if (printType.toLowerCase().includes('front') && printType.toLowerCase().includes('back')) {
  positionAddon = 40;
} else if (printType.toLowerCase().includes('embroidery') || printType.toLowerCase().includes('back')) {
  positionAddon = 30;
}

let volumePrice = basePrice;
if (quantity >= 500) volumePrice = Math.max(100, basePrice - 60);
else if (quantity >= 100) volumePrice = Math.max(120, basePrice - 30);
else if (quantity >= 50) volumePrice = Math.max(140, basePrice - 10);

const unitPrice = volumePrice + positionAddon;
const subtotal = unitPrice * quantity;
const gstTotal = isGstApplied ? Math.round(subtotal * (gstRate / 100)) : 0;
const totalAmount = subtotal + gstTotal;
```

---

## 13. Admin Quote Editing Tour

File: `apps/web/src/app/dashboard/quotes/[id]/page.tsx`
- **Access Rule:** Restricted to `ADMIN` and `SALES`. Customers receive HTTP 403 Forbidden.
- **Editable Parameters:**
  1. Quantity (`editQty`)
  2. Print Type (`editPrintType`: Front Only, Back Only, Front & Back, Embroidery)
  3. Color (`editColor`)
  4. Size (`editSize`)
  5. GST Toggle (`editIsGstApplied`: boolean)
  6. GST Rate (`editGstRate`: 5%, 12%, 18%)
  7. Variant Breakdown (`editVariants`: array of `{ color, size, quantity }`)
- **Persistence & Recalculation:**
  - Admin clicks "Save Changes" (`PUT /api/v1/quotes/:id`).
  - Backend executes `calculateServerPricing` using authoritative base prices from database.
  - Updates `QuoteItem` (`unitPrice`, `totalPrice`, `quantity`, `printType`, `color`, `size`).
  - Replaces all `QuoteItemVariant` records.
  - Updates `Quote` totals (`subtotal`, `gstTotal`, `totalAmount`).
  - Logs `PRICE_UPDATE` entry in `QuoteActivity`.

---

## 14. Statutory GST Flow

1. **Storage:**
   - Default GST rate stored on `Product.gstRate` (Float, default: `5.0`).
   - Snapshot rate stored on `Quote.gstRate` and `Quote.isGstApplied`.
   - Snapshot GST value stored on `Quote.gstTotal`, `Order.gstTotal`, and `Invoice.gstAmount`.
2. **Persistence & Historical Freezing:**
   - Once a Quote is created or updated, GST is frozen into database columns. Changes to product catalog tax rates never alter historical quotes or invoices.
3. **Customer Visibility:**
   - Customer sees clear line items in Customer Portal, PDF quote, and PDF invoice:
     - Taxable Subtotal
     - GST (5% / 12% / 18% or ₹0 if exempt)
     - Grand Total
4. **WhatsApp Dispatch:**
   - `generateWhatsAppMessage` dynamically formats GST line:
     `• GST (5%): ₹1,245` or `• GST: ₹0` if disabled.

---

## 15. 2D Quantity & Variant Matrix Tour

### 15.1 Current Model Support
The repository features **complete native schema support** for 2D color × size breakdown:
- `InquiryVariant` (`inquiryId`, `color`, `size`, `quantity`)
- `QuoteItemVariant` (`quoteItemId`, `color`, `size`, `quantity`)
- `OrderItemVariant` (`orderItemId`, `color`, `size`, `quantity`)

### 15.2 Validation Rules
- The sum of variant quantities MUST match the master item quantity:
  $$\sum \text{variant.quantity} == \text{item.quantity}$$
- Enforced on both frontend (`VariantBreakdownEntry.tsx`) and backend (`quotes.controller.ts` L368–L371 and L594–L598).
- **Variant Lineage:**
  $$\text{InquiryVariant} \xrightarrow{\text{Convert to Quote}} \text{QuoteItemVariant} \xrightarrow{\text{Convert to Order}} \text{OrderItemVariant}$$

---

## 16. Quote → Order Conversion (Production Order Creation)

Endpoint: `POST /api/v1/orders/from-quote/:quoteId`  
File: `server/src/modules/orders/orders.controller.ts` L16–L166

### 16.1 Guards & Validation
1. Quote MUST exist.
2. If role is `CUSTOMER`, customer MUST own the quote (`quote.customerId === req.user.id || quote.companyId === req.user.companyId`).
3. Quote status MUST be `'APPROVED'`.
4. Quote MUST contain items and total amount > 0.
5. Duplicate Guard: Checks `prisma.order.findUnique({ where: { quoteId } })`. If exists, returns HTTP 409 Conflict.

### 16.2 Atomic Transactional Records Created

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PRISMA TRANSACTION BOUNDARY                       │
│                                                                        │
│ 1. Create Order:                                                       │
│    - orderNumber: ZQB-ORD-YYYY-XXXX                                    │
│    - status: PENDING, paymentStatus: PENDING                           │
│    - Preserves subtotal, gstTotal, discountAmount, totalAmount         │
│                                                                        │
│ 2. Create OrderItems:                                                  │
│    - Clones all QuoteItem fields (product, printType, color, size, qty)│
│                                                                        │
│ 3. Create OrderItemVariants:                                           │
│    - Clones all QuoteItemVariant records (color, size, qty)            │
│                                                                        │
│ 4. Create ProductionJob:                                               │
│    - stage: PENDING                                                    │
│    - notes: "Order created from approved quotation #..."               │
│                                                                        │
│ 5. Create Invoice:                                                     │
│    - invoiceNumber: INV-YYYY-XXXX                                      │
│    - status: UNPAID, dueDate: now + 15 days                            │
│    - amount, gstAmount, totalAmount                                    │
│                                                                        │
│ 6. Close Linked Inquiry:                                               │
│    - status: CLOSED                                                    │
│    - InquiryActivity: "Converted to Order #ZQB-ORD-..."                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Order Lifecycle & State Machine

Defined in `server/src/modules/orders/orders.controller.ts` L6–L14 via `ALLOWED_ORDER_TRANSITIONS`:

| Current State | Permitted Next States | Triggered By |
| :--- | :--- | :--- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | Customer Payment or Admin Confirmation |
| `CONFIRMED` | `IN_PRODUCTION`, `CANCELLED` | Production Desk (Job started) |
| `IN_PRODUCTION` | `READY_FOR_DISPATCH`, `CANCELLED` | Production Desk (Printing/QC finished) |
| `READY_FOR_DISPATCH`| `DISPATCHED`, `CANCELLED` | Dispatch Desk (Courier assigned) |
| `DISPATCHED` | `DELIVERED`, `CANCELLED` | Courier Webhook / Delivery Confirmation |
| `DELIVERED` | None (Terminal) | Fulfillment Completed |
| `CANCELLED` | None (Terminal) | Aborted |

---

## 18. Order Detail & Source of Truth Audit

Files:
- Admin Order Desk: `apps/web/src/app/dashboard/orders/[id]/page.tsx`
- Customer Order Desk: `apps/web/src/app/customer/orders/page.tsx`

### Source Verification Matrix:
- Customer Name: Always sourced from `order.customer.name`.
- Customer Phone: Always sourced from `order.customer.phone`.
- Corporate Details: Always sourced from `order.company.name` and `order.company.gstin`.
- Item Specifications: Sourced from `order.items[]` and `order.items[].variants[]`.
- Associated Invoice: Sourced from `order.invoices[0]`.
- Associated Dispatch: Sourced from `order.dispatch`.

---

## 19. Shop-Floor Production Flow

File: `server/src/modules/production/production.controller.ts`
- **Model:** `ProductionJob` (`prisma/schema.prisma` L436–L450)
- **Stages:** `PENDING` -> `PRINTING` -> `QUALITY_CHECK` -> `PACKING` -> `READY_TO_DISPATCH`
- **Kanban API:** `GET /api/v1/production/kanban` groups jobs by stage.
- **Stage Progression:** `PUT /api/v1/production/:id/stage`
  - Moving to `PRINTING` automatically sets `startedAt = new Date()`.
  - Moving to `READY_TO_DISPATCH` sets `completedAt = new Date()` and automatically promotes the parent order to `status = 'READY_FOR_DISPATCH'`.

---

## 20. Razorpay Payment Architecture & Security

File: `server/src/modules/payments/payments.controller.ts`

### 20.1 Workflow
1. **Order Initiation (`POST /api/v1/payments/create-order`):**
   - Retrieves `Order` record by `orderId`.
   - Checks customer ownership (`order.customerId === req.user.id`).
   - Calculates amount in **Paise** from PostgreSQL (`Math.round(order.totalAmount * 100)`). **Never trusts client amount.**
   - Creates Razorpay order via official SDK (`razorpay.orders.create`).
   - Creates `Payment` record in database with status `PENDING`.
   - Returns `razorpayOrderId`, `amount`, and `keyId` to frontend.
2. **Signature Verification (`POST /api/v1/payments/verify`):**
   - Receives `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
   - Constructs HMAC payload: `razorpay_order_id + '|' + razorpay_payment_id`.
   - Computes expected SHA-256 HMAC using `process.env.RAZORPAY_KEY_SECRET`.
   - Compares expected vs received signature.
   - If valid: marks `Payment.status = 'SUCCESS'`, marks `Order.paymentStatus = 'PAID'`.
   - If invalid: marks `Payment.status = 'FAILED'`, returns HTTP 400.
3. **Webhook Idempotency (`POST /api/v1/payments/webhook`):**
   - Validates `x-razorpay-signature`.
   - On `payment.captured`, idempotently marks payment as `SUCCESS` and order as `PAID`.

---

## 21. Invoice Generation & Tax Accounting

File: `server/src/modules/invoices/invoices.controller.ts`
- **Trigger:** Generated automatically during Quote -> Order conversion.
- **Numbering:** Sequential `INV-YYYY-XXXX` (e.g., `INV-2026-8012`).
- **PDF Generation Engine:** `server/src/utils/pdfGenerator.ts` using `PDFKit`.
- **Contents:**
  - ZOBBRA B2B Letterhead & GSTIN
  - Buyer Corporate Name, GSTIN, Address
  - Line Items (Product, Print Position, Color, Size, Quantity, Unit Price, Total)
  - Taxable Value, CGST/SGST/IGST breakdown, Grand Total
  - Payment Terms (15 days) & Bank Coordinates
- **Endpoint:** `GET /api/v1/invoices/:id/pdf` streams binary PDF buffer with headers:
  `Content-Disposition: attachment; filename="Invoice-INV-2026-8012.pdf"`.

---

## 22. Cloudinary Asset Management Flow

Files:
- Backend: `server/src/modules/media/media.controller.ts` & `media.routes.ts`
- Frontend: `apps/web/src/lib/upload.ts`

### 22.1 Cryptographic Signature Flow
1. Frontend requests signature: `GET /api/v1/media/signature`.
2. Backend computes HMAC-SHA1 using Cloudinary API Secret:
   - Dedicated asset folder: `folder = 'zobbra'`.
   - Timestamp: Unix epoch seconds.
   - Returns `{ signature, timestamp, cloudName, apiKey, folder }`.
3. Frontend uploads directly to Cloudinary:
   `POST https://api.cloudinary.com/v1_1/<cloudName>/auto/upload`.
4. Cloudinary returns HTTPS asset URL (`secure_url`).

### 22.2 Critical Security Finding
`GET /api/v1/media/signature` requires JWT authentication:
```typescript
router.get('/signature', authenticateJWT, authorizeRoles('ADMIN', 'SALES', 'CUSTOMER'), getSignature);
```
**Impact:** Unauthenticated Guest visitors attempting to upload mockups on `/get-quote` will encounter a 401 Unauthorized error when calling `/api/v1/media/signature`. For guest uploads, either an unsigned Cloudinary upload preset or an unauthenticated guest signing endpoint must be introduced.

---

## 23. WhatsApp Communication Engine

Files:
- Frontend: `apps/web/src/lib/whatsapp.ts`
- Backend: `server/src/utils/whatsappTemplates.ts`

### 23.1 Phone Normalization (`normalizePhoneForWhatsApp`)
Converts varied Indian phone formats into international E.164 without leading plus:
- `+91 98765 43210` -> `919876543210`
- `09876543210` -> `919876543210`
- `9876543210` -> `919876543210`

### 23.2 Templates Supported
- `NEW_QUOTE`: Initial quotation notification
- `QUOTE_UPDATED`: Revised pricing notification
- `QUOTE_READY`: Full quotation specification and price breakdown
- `FOLLOW_UP`: Follow-up reminder
- `APPROVED_QUOTE`: Order conversion acknowledgment

---

## 24. Customer Portal: "My Quotes & Requests" Tour

File: `apps/web/src/app/customer/quotes/page.tsx`
- **Data Unification:** Fetches `GET /api/v1/quotes` AND `GET /api/v1/inquiries` concurrently.
- **Normalization:** Merges both lists into `UnifiedRequest[]`, sorted by descending `createdAt`.
- **Customer Actions:**
  - If Quote is in `SENT`/`DRAFT`: Customer can click "APPROVE" or "REJECT".
  - If Quote is `APPROVED`: Customer can click "CONVERT TO ORDER".
  - If item is an Inquiry: Displayed with badge `MOCKUP` and status `Pending Quote`.

---

## 25. Database Relationship Map

```
                  ┌────────────────────┐
                  │      Category      │
                  └─────────┬──────────┘
                            │ 1
                            │ *
                  ┌─────────▼──────────┐
                  │      Product       │◄────────┐
                  └─────────┬──────────┘         │
             ┌──────────────┼──────────────┐     │
           1 │ *          1 │ *          1 │ *   │
┌────────────▼───┐ ┌────────▼───┐ ┌────────▼─────▼─┐
│ BulkPricing    │ │ProdVariant │ │  Inquiry       │
└────────────────┘ └────────────┘ └────────┬───────┘
                                           │ 1 (optional)
                                           │ 1
┌────────────────┐ 1            * ┌────────▼───────┐
│    Company     │────────────────│     Quote      │
└───────┬────────┘                └────────┬───────┘
      1 │ *                              1 │ 1
┌───────▼────────┐                ┌────────▼───────┐
│     User       │                │     Order      │
└────────────────┘                └──┬──┬──┬───────┘
                                   1 │1 │1 │1
           ┌─────────────────────────┼──┴──┼─────────────────────────┐
           │                         │     │                         │
┌──────────▼─────────┐    ┌──────────▼─┐ ┌─▼──────────┐   ┌──────────▼─────────┐
│   ProductionJob    │    │  Dispatch  │ │  Payment   │   │     Invoice        │
└────────────────────┘    └────────────┘ └────────────┘   └────────────────────┘
```

---

## 26. Data Lineage Map

| Business Field | UI Entry Point | API Route | Controller / Service | Prisma Model & Field |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Name** | `SimplifiedQuoteForm.tsx` | `POST /inquiries` | `InquiryController.create` | `Inquiry.customerName` |
| **Customer Phone** | `SimplifiedQuoteForm.tsx` | `POST /inquiries` | `InquiryController.create` | `Inquiry.phone` |
| **Artwork URL** | Cloudinary file input | `POST /inquiries` | `InquiryController.create` | `Inquiry.artworkUrl` |
| **Variant Matrix**| `VariantBreakdownEntry` | `POST /inquiries` | `InquiryService.createInquiry` | `InquiryVariant` rows |
| **Quote Price** | Admin Quote Editor | `PUT /quotes/:id` | `calculateServerPricing` | `QuoteItem.unitPrice`, `totalPrice` |
| **GST Snapshot** | Admin Quote Editor | `PUT /quotes/:id` | `calculateServerPricing` | `Quote.gstTotal`, `Quote.isGstApplied` |
| **Order Record** | "Convert to Order" btn | `POST /orders/from-quote/:id` | `orders.controller.ts` | `Order.orderNumber`, `status` |
| **Production Job**| Auto on Order convert | `POST /orders/from-quote/:id` | `orders.controller.ts` | `ProductionJob.stage = 'PENDING'` |
| **Tax Invoice** | Auto on Order convert | `POST /orders/from-quote/:id` | `orders.controller.ts` | `Invoice.invoiceNumber`, `totalAmount` |
| **Payment Verification**| Razorpay Modal | `POST /payments/verify` | `payments.controller.ts` | `Payment.status = 'SUCCESS'` |

---

## 27. Hardcoded / Dummy Data Audit

A systematic scan of the entire repository was performed:

| Term / Value | Location | Classification | Assessment & Detail |
| :--- | :--- | :--- | :--- |
| `admin@zobra.test` | `apps/web/src/app/(auth)/login/page.tsx`, Cypress tests | **DEV/TEST ONLY** | One-click login shortcut for local testing. |
| `admin123` | `apps/web/src/app/(auth)/login/page.tsx` | **DEV/TEST ONLY** | Default credential for local seed testing. |
| `rzp_test_51ZobraDemoKey` | `server/src/modules/payments/payments.controller.ts` | **SAFE** | Fallback for local development when Razorpay keys are unset. |
| `21AAACA1234A1Z5` | `apps/web/src/app/customer/products/page.tsx` L89 | **LEGACY / SUSPICIOUS** | Hardcoded sample GSTIN passed when submitting from customer catalog. |
| `Bhubaneswar, Odisha` | `apps/web/src/app/customer/products/page.tsx` L90 | **LEGACY / SUSPICIOUS** | Hardcoded address fallback. Should be loaded from `user.company.address`. |
| `polo-200gsm` | `server/src/modules/quotes/quotes.controller.ts` L320 | **SAFE FALLBACK** | Auto-creates demo apparel product if database is completely empty. |
| `Custom Merchandise` | `server/src/modules/inquiries/inquiries.controller.ts` | **SAFE** | Fallback title when no product interest is supplied. |

---

## 28. Security Audit

1. **Authentication & Token Handling:** Standard JWT with configurable expiry. Stored in `localStorage`.
2. **Authorization (RBAC):** `authorizeRoles` enforced on all administrative endpoints. Customer portal endpoints verify `req.user.role === 'CUSTOMER'`.
3. **Horizontal Privilege Escalation (IDOR) Protection:**
   - Quotes: Verified via `quote.customerId === req.user.id || quote.companyId === req.user.companyId`.
   - Orders: Verified via `order.customerId === req.user.id || order.companyId === req.user.companyId`.
   - Invoices: Verified via `invoice.order.customerId === req.user.id || invoice.companyId === req.user.companyId`.
4. **Financial Security:**
   - Razorpay order amount is calculated server-side in Paise directly from the database record. Client amounts are never accepted.
   - Payment signatures are verified using `crypto.createHmac('sha256', keySecret)`.
5. **CORS:** Restricted to `zobbra.com`, `app.zobbra.com`, and `localhost:3000`.
6. **Input Sanitization:** Phone numbers are strictly regex-sanitized (`replace(/\D/g, '')`) before forming WhatsApp URLs.

---

## 29. Frontend Route Inventory

### Public Routes:
- `/`: Marketing landing page (Hero, Categories, Trust metrics, CTA)
- `/products`: Public product catalog grid
- `/products/[id]`: Product specification detail view with volume price calculator
- `/get-quote`: Public intake form (`SimplifiedQuoteForm`)
- `/login`, `/register`, `/forgot-password`, `/reset-password`: Auth flows

### Customer Portal (`/customer/*` - Requires `CUSTOMER` role):
- `/customer`: Portal dashboard overview
- `/customer/products`: Authenticated product browsing
- `/customer/create-quote`: Self-service quotation builder
- `/customer/quotes`: "My Quotes & Requests" management list
- `/customer/orders`: Order tracking & status history
- `/customer/invoices`: Commercial invoice viewing & PDF downloads
- `/customer/payment`: Razorpay checkout handler
- `/customer/tracking`: Shipment logistics tracker
- `/customer/profile`: Company and user profile settings

### Admin / Sales Desk (`/dashboard/*` - Requires `ADMIN` or `SALES` role):
- `/dashboard`: Executive KPI overview
- `/dashboard/inquiries`: Customer inquiry and lead desk
- `/dashboard/inquiries/[id]`: Full inquiry detail and review desk
- `/dashboard/quotes`: Quotation management table
- `/dashboard/quotes/[id]`: Quotation specification and pricing editor
- `/dashboard/orders`: Order lifecycle desk
- `/dashboard/orders/[id]`: Order fulfillment and customer verification view
- `/dashboard/customers`: Corporate customer CRM
- `/dashboard/products`: Catalog management

---

## 30. Backend API Inventory

| Method | Endpoint | Auth | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | None | Public | JWT Token generation |
| `POST` | `/api/v1/auth/register` | None | Public | Customer & Company registration |
| `GET` | `/api/v1/products` | None | Public | Fetch catalog products |
| `GET` | `/api/v1/products/:id` | None | Public | Fetch single product detail |
| `POST` | `/api/v1/inquiries` | Optional | Public/Customer | Submit new inquiry |
| `GET` | `/api/v1/inquiries` | Required | Any | List inquiries (scoped by role) |
| `GET` | `/api/v1/inquiries/:id`| Required | Any | Fetch single inquiry details |
| `POST` | `/api/v1/inquiries/:id/convert-to-quote` | Required | Admin/Sales | Convert inquiry to Quote |
| `GET` | `/api/v1/quotes` | Required | Any | List quotes (scoped by role) |
| `GET` | `/api/v1/quotes/:id` | Required | Any | Fetch quote detail |
| `POST` | `/api/v1/quotes` | Required | Any | Create quote |
| `PUT` | `/api/v1/quotes/:id` | Required | Admin/Sales | Edit quote specifications |
| `PATCH`| `/api/v1/quotes/:id/status` | Required | Any | Approve/Reject/Status change |
| `POST` | `/api/v1/orders/from-quote/:quoteId` | Required | Any | Convert approved quote to order |
| `GET` | `/api/v1/orders` | Required | Any | List orders (scoped by role) |
| `GET` | `/api/v1/orders/:id` | Required | Any | Get order details |
| `POST` | `/api/v1/payments/create-order` | Required | Any | Initiate Razorpay order |
| `POST` | `/api/v1/payments/verify` | Required | Any | Verify Razorpay HMAC signature |
| `GET` | `/api/v1/invoices/:id/pdf` | Required | Any | Download official invoice PDF |
| `GET` | `/api/v1/media/signature` | Required | Any User | Cloudinary cryptographic signature |

---

## 31. Test Inventory

### Cypress E2E Tests (42 Suites in `apps/web/cypress/e2e`):
- `public_inquiry.cy.ts`: Public guest quote submission and validation.
- `inquiry_to_quote.cy.ts`: Admin converting inquiry into quotation.
- `quote_builder.cy.ts`: Creating quotes with variant breakdown.
- `customer_create_quote.cy.ts`: Customer self-service quotation flow.
- `quote_to_order.cy.ts`: Customer approving quote and converting to order.
- `order_lifecycle.cy.ts`: Order transition through production and dispatch.
- `razorpay_payment.cy.ts`: Payment order creation and verification.
- `customer_invoice.cy.ts`: Invoice PDF rendering and download validation.
- `negative_paths.cy.ts`: Unauthenticated and unauthorized access blocking.

### Backend Supertest Suites (`server/tests`):
- `inquiries.test.ts`: Inquiry creation and conversion logic.
- `quotes.test.ts`: Quote pricing calculations and status rules.
- `orders.test.ts`: Order creation transaction and duplicate prevention.
- `whatsapp.test.ts`: Phone normalization and template formatting.

---

## 32. Current Architectural Limitations for Customizer

1. **No Design Entity:** The database has no table to store Canvas JSON, vector layers, text strings, uploaded logos, scale, rotation, or coordinates.
2. **Single-View Storage:** There is no schema convention for storing both front and back previews.
3. **QuoteItem Schema Omission:** `QuoteItem` does not have a `customizationDetails` column (unlike `OrderItem`).
4. **Cloudinary Signature Barrier:** Guests cannot obtain upload signatures from `GET /api/v1/media/signature` without a JWT.
5. **No Direct Customizer Link from Product Detail:** The product detail page redirects directly to `/get-quote` rather than a customization interface.

---

## 33. Future Design Customizer Integration Points

1. **Product Detail Link:** Add a prominent "Design Your Own / Customize" CTA alongside "Get a Quick Quote" on `/products/[id]`.
2. **Guest Verification:** Guests can design on canvas immediately in local state. Upon clicking "Submit Custom Design", a modal captures Name, Phone, and OTP/WhatsApp verification.
3. **Logged-in Customers:** Logged-in customers bypass verification completely because their identity is established via JWT.
4. **Design Data Storage:** A dedicated `Design` model should store:
   - `previewFrontUrl`: Cloudinary PNG/WEBP preview.
   - `previewBackUrl`: Cloudinary PNG/WEBP preview.
   - `canvasStateJson`: Full serializable JSON of canvas layers, text, fonts, colors, and asset positions.
5. **Connection to Business Flow:**
   - Link `Design.id` -> `Inquiry.designId` (for guest/mockup requests).
   - Link `Design.id` -> `QuoteItem.designId` (for quotes).
   - Link `Design.id` -> `OrderItem.designId` (for orders).
6. **Admin & Production Previews:** Admin and factory teams inspect the exact high-res front/back renders directly in the Inquiry Desk, Quote Review, and Production Job Kanban.

---

## 34. Recommended Future Architecture

```
                                VISITOR JOURNEY
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
             [ QUICK QUOTE ]                      [ DESIGN YOUR OWN ]
                    │                                     │
           (SimplifiedQuoteForm)                  (Interactive Canvas)
                    │                                     │
                    │                             • Front / Back switch
                    │                             • Upload Logo / Artwork
                    │                             • Color & Size Matrix
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                     SUBMIT AS INQUIRY / QUOTE DRAFT
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                 Guest Intake                Customer Portal
              (Creates Inquiry +             (Creates Quote +
               Linked Design)                 Linked Design)
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                              ADMIN SALES REVIEW
                           (Inspects Design & Pricing)
                                       │
                                       ▼
                                 OFFICIAL QUOTE
                                (With Design Specs)
                                       │
                                       ▼
                               CUSTOMER APPROVAL
                                       │
                                       ▼
                                PRODUCTION ORDER
                          (Auto-attaches Design Assets
                           to Production Job & Invoices)
```

---

## 35. Critical Final Questions Answered (A through R)

### A. What is the exact CURRENT customer order journey from first click to completed delivery?
1. Visitor browses products on `/products` or clicks "Get a Free Quote" on `/`.
2. Fills `SimplifiedQuoteForm` on `/get-quote` (Name, Phone, Category, Quantity, Reference Artwork).
3. Backend records `Inquiry` with status `NEW`.
4. Admin opens `/dashboard/inquiries`, reviews requirements, and clicks "Convert to Quote".
5. Backend auto-provisions a registered `User` (if guest), creates `Quote` (`ZQB-YYYY-XXXX`) with status `DRAFT`, copies variant breakdown to `QuoteItemVariant`, and sets Inquiry to `CONVERTED`.
6. Admin edits quote pricing/specs on `/dashboard/quotes/[id]` and clicks "Send via WhatsApp" (transitions Quote to `SENT`).
7. Customer logs in, visits `/customer/quotes`, reviews quotation breakdown, and clicks "APPROVE" (`status = 'APPROVED'`).
8. Customer clicks "CONVERT TO ORDER" on `/customer/quotes`.
9. Backend executes atomic transaction creating `Order` (`ZQB-ORD-YYYY-XXXX`), `OrderItem`, `OrderItemVariant`, `ProductionJob` (`stage: PENDING`), `Invoice` (`status: UNPAID`), and closes linked Inquiry.
10. Customer visits `/customer/payment`, pays via Razorpay modal; backend verifies HMAC signature and sets `order.paymentStatus = 'PAID'`.
11. Production progresses through Kanban (`PRINTING` -> `QUALITY_CHECK` -> `PACKING` -> `READY_TO_DISPATCH`).
12. Dispatch desk assigns courier and tracking number, moving order to `DISPATCHED` and generating shipment record (`SHP-ZB-YYYY-XXXX`).
13. Order is marked `DELIVERED` upon courier confirmation.

### B. At what exact point does an Inquiry become a Quote?
When an Admin or Sales user clicks **"Convert to Quote"** in the Inquiry desk (`POST /api/v1/inquiries/:id/convert-to-quote`).

### C. At what exact point does a Quote become an Order?
When the Customer or Admin triggers **"Convert to Order"** (`POST /api/v1/orders/from-quote/:quoteId`) on a Quote that has status `APPROVED`.

### D. Where is the customer's identity stored?
In the `User` table (`prisma/schema.prisma` L138–L173). Key fields: `id`, `email`, `passwordHash`, `name`, `phone`, `role`, `companyId`.

### E. Where is the company's identity stored?
In the `Company` table (`prisma/schema.prisma` L175–L196). Key fields: `id`, `name`, `gstin`, `address`, `city`, `state`, `pincode`.

### F. How are customer details shown to Admin?
Directly from the linked relationship (`quote.customer`, `order.customer`, `inquiry.customerName` / `inquiry.customer`). The admin's session user (`req.user`) is NEVER displayed as customer data.

### G. Where are reference/mockup files stored?
Assets are uploaded to Cloudinary under the `zobbra/` folder prefix. The secure HTTPS URL is stored in `Inquiry.artworkUrl` (comma-delimited string) or passed in `Quote.notes`.

### H. Does Quote currently support design information?
Only partially as unstructured text: `printType` on `QuoteItem`, and notes in `Quote.notes`. It lacks structured canvas objects or multi-view preview fields.

### I. Does Order currently preserve design information?
`OrderItem` has a column `customizationDetails String?`, which preserves plain text specifications. Order items also clone `printType`, `color`, `size`, and 2D variant records from the quote.

### J. Does the database currently support color/size quantity breakdown?
**YES.** `InquiryVariant`, `QuoteItemVariant`, and `OrderItemVariant` fully support color × size × quantity breakdowns.

### K. Does the database currently support a design object?
**NO.** There is no `Design` table or model in `prisma/schema.prisma`.

### L. Does the current application support front/back artwork?
Only as a single text label on `printType` (e.g., `'Front Only'`, `'Back Only'`, `'Front & Back'`). It does NOT store independent front and back canvas state or image previews.

### M. What existing APIs can be reused by the customizer?
- `GET /api/v1/products` & `GET /api/v1/products/:id` (catalog & pricing tiers)
- `POST /api/v1/inquiries` (submitting customizer inquiries)
- `POST /api/v1/quotes` (submitting customer quotes)
- `PUT /api/v1/quotes/:id` (editing quotes)
- `POST /api/v1/orders/from-quote/:quoteId` (converting quotes to production orders)
- `POST /api/v1/payments/create-order` & `POST /api/v1/payments/verify` (payments)

### N. What new APIs will probably be required?
- `POST /api/v1/designs`: Save canvas state, layers, and front/back preview image URLs.
- `GET /api/v1/designs/:id`: Fetch design state for re-editing or admin inspection.
- `GET /api/v1/media/guest-signature`: Enable guest visitors to upload design assets to Cloudinary.

### O. What Prisma models/fields would need to change?
1. **New Model `Design`:**
   ```prisma
   model Design {
     id              String       @id @default(uuid())
     productId       String
     product         Product      @relation(fields: [productId], references: [id])
     previewFrontUrl String?
     previewBackUrl  String?
     canvasStateJson Json?
     createdAt       DateTime     @default(now())
     updatedAt       DateTime     @updatedAt
     inquiries       Inquiry[]
     quoteItems      QuoteItem[]
     orderItems      OrderItem[]
   }
   ```
2. **Add Relation Fields:**
   - `Inquiry.designId`: Optional FK -> `Design`
   - `QuoteItem.designId`: Optional FK -> `Design`
   - `QuoteItem.customizationDetails`: String?
   - `OrderItem.designId`: Optional FK -> `Design`

### P. What existing screens should be reused rather than recreated?
- **DO NOT recreate:** `/dashboard/quotes/[id]` (Admin Quote Editor), `/customer/quotes` (Customer Quotes), `/dashboard/orders` (Order Fulfillment), `/dashboard/inquiries` (Inquiry Desk).
- **REUSE & ENHANCE:** Embed the design preview thumbnail and vector download link directly into the existing Inquiry drawer, Quote Item row, and Order Detail component.

### Q. What parts of the current Quote → Order workflow MUST NOT be changed?
- `calculateServerPricing` algorithm (base prices, volume discounts, position add-ons, GST).
- Status validation guard: Quote MUST be in `APPROVED` status to convert to an order.
- Order creation transaction: Creation of `Order`, `OrderItem`, `OrderItemVariant`, `ProductionJob`, and `Invoice` MUST remain atomic.
- Razorpay server-side Paise amount calculation and HMAC signature verification.

### R. What is the safest architecture for adding "Quick Quote" + "Design Your Own"?
Maintain two complementary entry points on `/products/[id]`:
1. **"Quick Quote"**: Retains the existing lightweight `SimplifiedQuoteForm` flow.
2. **"Design Your Own"**: Launches the interactive canvas customizer. When submitted, it stores a `Design` record and attaches `designId` to the resulting `Inquiry` or `Quote`. Both paths cleanly merge into the identical Quote -> Approval -> Order -> Production pipeline without disrupting any existing database records or admin workflows.

---

## 36. Verification & Conclusion

This audit was conducted strictly in read-only mode. No code, configuration, Docker files, database migrations, or remote environments were modified. The findings documented herein provide the authoritative blueprint for engineering the ZOBBRA Product Customizer.
