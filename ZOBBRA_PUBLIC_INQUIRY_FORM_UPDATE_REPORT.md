# ZOBBRA — Complete Public Inquiry & Sales Qualification Implementation Report

**Release Date:** August 25, 2026  
**System Brand:** ZOBBRA (Wear Your Brand)  
**Modules Affected:** Public Website (`/get-quote`), Backend API (`/api/v1/inquiries`), Database (`Inquiry` Model), Admin Inquiry Desk (`/dashboard/inquiries`), Pricing Engine & Conversion Flow  
**Status:** COMPLETE & VERIFIED (100% Tests Passing, Production Build Validated)

---

## 1. Executive Summary & Business Flow Alignment

In accordance with ZOBBRA's B2B sales funnel business architecture, the public **"Get a Quote"** form on the ZOBBRA website **does NOT directly create a Quote**. 

It creates an **INQUIRY / LEAD** record in the database. The inquiry captures all customer and technical customization specifications required for the Admin/Sales team to qualify the lead, initiate sales communication (via WhatsApp / Phone), discuss nuances, and then explicitly click **CONVERT TO QUOTE** when ready.

```
========================================================================================
                          CANONICAL ZOBBRA B2B SALES FUNNEL
========================================================================================

   PUBLIC WEBSITE (Guest or Registered User)
      ↓
   Request Merchandise Quote (/get-quote)
      ↓
   POST /api/v1/inquiries (Captures 12+ Qualification Specs)
      ↓
   Generates Inquiry Record (e.g. INQ-2026-0005, Status: NEW)
      ↓
   ADMIN INQUIRY DESK (/dashboard/inquiries)
      ↓
   Assign Sales Lead → Direct WhatsApp / Phone Contact → Discuss Requirements & Sizing
      ↓
   Admin/Sales clicks "CONVERT TO QUOTE"
      ↓
   Intelligent Pre-Fill: Generates Quote (ZQB-2026-XXXX) + Line Items with Volume Pricing
      ↓
   Quote Sent → Customer Approves → Order Created → Manual Payment MVP → PAID
========================================================================================
```

---

## 2. Complete Field Specifications Captured

The public inquiry form now collects all essential B2B qualification data:

| Section | Field Name | Type | Requirement | Description / Options |
| :--- | :--- | :--- | :--- | :--- |
| **1. Customer & Company** | **Company / Organization Name** | Text Input | **REQUIRED** | Legal or trading entity (e.g., Acme Tech Pvt Ltd) |
| | **Contact Name** | Text Input | **REQUIRED** | Authorized representative (e.g., Rahul Mishra) |
| | **Phone Number** | Tel Input | **REQUIRED** | Direct contact / WhatsApp number |
| | **Email Address** | Email Input | *Optional* | Official correspondence email |
| | **Location / City** | Text Input | *Optional* | City & State (e.g., Mumbai, Maharashtra) |
| **2. Product Requirement** | **Category / Product Interest** | Select Dropdown | **REQUIRED** | `Polo T-Shirts`, `Round Neck T-Shirts`, `Hoodies & Sweatshirts`, `Cotton Caps`, `Executive Backpacks`, `Stainless Steel Bottles`, `Corporate Gifts / Other` |
| | **Specific Product** | Text Input | *Optional* | e.g., "240 GSM Bio-Washed Pique Polo" |
| | **Estimated Quantity** | Number Input | **REQUIRED** | Minimum 1, default 100 units |
| **3. Customization** | **Color Preference** | Text Input | *Optional* | e.g., "Navy Blue, Charcoal Melange" |
| | **Size Breakdown** | Text Input | *Optional* | e.g., "S: 20, M: 50, L: 50, XL: 30" |
| | **Printing Type** | Select Dropdown | *Optional* | `DTF`, `Screen Printing`, `Embroidery`, `Sublimation`, `Other` |
| | **Print Position** | Select Dropdown | *Optional* | `Front`, `Back`, `Front + Back`, `Left Chest`, `Sleeve`, `Embroidery`, `Other` |
| | **Artwork / Logo Link** | URL / Text | *Optional* | Google Drive link, Figma link, or asset URL |
| | **Customization Notes** | Textarea | *Optional* | Detailed specifications, placement, fabric GSM |
| **4. Commercial & Delivery** | **Budget Range** | Select Dropdown | *Optional* | `Under ₹10,000`, `₹10,000 – ₹25,000`, `₹25,000 – ₹50,000`, `₹50,000 – ₹1,00,000`, `₹1,00,000+`, `Not Sure` |
| | **Required Delivery Date** | Date Picker | *Optional* | Targeted delivery date for events or campaigns |

---

## 3. Database Schema & Migration

Updated `prisma/schema.prisma` `Inquiry` model:

```prisma
model Inquiry {
  id                          String          @id @default(uuid())
  inquiryNumber               String          @unique
  customerId                  String?
  customer                    User?           @relation("CustomerInquiries", fields: [customerId], references: [id])
  companyId                   String?
  company                     Company?        @relation(fields: [companyId], references: [id])
  customerName                String?
  companyName                 String?
  email                       String?
  phone                       String?
  location                    String?
  customerType                CustomerType    @default(GUEST)
  
  // Product & Customization Qualification
  productId                   String?
  product                     Product?        @relation(fields: [productId], references: [id])
  productInterest             String?
  quantity                    Int?
  printingType                String?
  printPosition               String?
  colors                      String?
  sizes                       String?
  artworkUrl                  String?
  deliveryDate                DateTime?
  budget                      String?
  customizationRequirements   String?
  
  source                      InquirySource   @default(WEBSITE)
  message                     String?
  status                      InquiryStatus   @default(NEW)
  assignedToId                String?
  assignedTo                  User?           @relation("AssignedInquiries", fields: [assignedToId], references: [id])
  quoteId                     String?         @unique
  quote                       Quote?          @relation(fields: [quoteId], references: [id])
  nextFollowUpAt              DateTime?
  activities                  InquiryActivity[]
  createdAt                   DateTime        @default(now())
  updatedAt                   DateTime        @updatedAt

  @@index([status])
  @@index([customerId])
  @@index([assignedToId])
}
```

Database schema pushed and synchronized via `pnpm prisma db push` and `pnpm prisma generate`.

---

## 4. Frontend & Admin Experience

### 4.1 Public Website Form (`/get-quote`)
- **Modern 4-Section Progressive Card Layout**: Built with Tailwind CSS & Lucide icons matching the ZOBBRA Design System (`#111111` primary, `#3B6FEB` accents, `#F8F9FC` background).
- **Guest & Registered Support**: Seamlessly accepts guest submissions and automatically links registered user authentication tokens (`Bearer token`) if logged in.
- **Success State Experience**: Displays:
  - Official confirmation badge: `Inquiry submitted successfully`
  - Canonical Inquiry ID: `INQ-2026-XXXX`
  - Reassurance text: *"Thank you. Our sales team will review your requirements and contact you shortly."*
  - Action button: *"Submit Another Request"*

### 4.2 Admin Inquiry Desk (`/dashboard/inquiries`)
- **Comprehensive Inquiry Drawer**:
  - **Customer Profile**: Displays Customer Type badge (`GUEST` / `REGISTERED`), Company Name, Contact Name, Email, Phone, and Location.
  - **Quick Contact Buttons**: One-click WhatsApp chat launch (`https://wa.me/...`) and Direct Phone Call.
  - **Specification Breakdown**: Displays Product Interest, Quantity, Colors, Sizes Breakdown, Printing Type, Print Position, Budget Range, Delivery Date, Artwork Link, and Customization Notes.
  - **Activity Timeline**: Allows sales reps to log call notes and customer discussion points.
  - **Status Management**: Tracks transitions across `NEW` → `CONTACTED` → `FOLLOW_UP` → `CONVERTED` / `LOST`.
  - **Convert to Quote**: One-click action that triggers backend pre-filling and redirects directly to the newly drafted quote.

---

## 5. Quote Conversion & Pricing Engine

When Admin/Sales clicks **CONVERT TO QUOTE**:
1. **User Provisioning**: If the inquiry was submitted by a Guest, `InquiryService.convertToQuote` automatically provisions a customer account using their phone or email, ensuring database relational integrity.
2. **Product & Spec Resolution**: Intelligently resolves the product from catalog or `productInterest`. Maps inquiry specs (`colors` → `color`, `sizes` → `size`, `printingType` + `printPosition` → `printType`).
3. **Volume Pricing Calculation**: Runs tier-based bulk pricing (e.g. 50+ pcs, 100+ pcs, 500+ pcs) and print position add-ons so the generated quote has realistic, non-zero unit price, subtotal, GST, and total amount.
4. **Relational Link & Status Update**: Sets `inquiry.status = CONVERTED`, links `inquiry.quoteId`, and logs an activity entry in the inquiry timeline.

---

## 6. Test Suite & Verification Results

### 6.1 Server Unit Tests
```
Test Suites: 6 passed, 6 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        17.424 s
```
- `inquiries.test.ts`: PASSED (100%)
- `orders.test.ts`: PASSED (100%)
- `payments.test.ts`: PASSED (100%)
- `quotes.test.ts`: PASSED (100%)
- `whatsapp.test.ts`: PASSED (100%)
- `api.test.ts`: PASSED (100%)

### 6.2 Monorepo Production Build (`pnpm build`)
- Packages compiled: `@zobra/api`, `@zobra/database`, `@zobra/shared`, `zobra-server`, `web`.
- 44 static and dynamic routes compiled without errors.
- **Tasks: 5 successful, 5 total.**

### 6.3 Cypress End-to-End Test Specs
- `apps/web/cypress/e2e/public_inquiry.cy.ts`:
  - `Step 1`: Submits a comprehensive Guest Inquiry with all optional fields (PASSED).
  - `Step 2`: Admin reviews the created Inquiry and verifies all captured qualification fields in drawer (PASSED).
  - `Step 3`: Registered customer submits inquiry and is automatically identified as REGISTERED (PASSED).
  - **Result: 3 passing (24s)**
- `apps/web/cypress/e2e/inquiry_to_quote.cy.ts`:
  - `Step 1`: Admin reviews inquiry and converts to quote with pre-filled specs & pricing (PASSED).
  - **Result: 1 passing (18s)**

---

## 7. Manual Acceptance Testing Instructions

To manually test the complete end-to-end flow:

1. **Submit Public Inquiry (Guest)**:
   - Navigate to `http://localhost:3000/get-quote`.
   - Fill in Company Name, Contact Name, Phone Number, select Product Interest (e.g. Polo T-Shirts), set Quantity (e.g. 100), choose Colors, Sizes, Print Type (Screen Printing), Print Position (Front + Back), and Delivery Date.
   - Click **SUBMIT QUOTE INQUIRY**.
   - Verify success screen displays `INQ-2026-XXXX`.

2. **Review in Admin Dashboard**:
   - Login at `http://localhost:3000/login` with `admin@zobra.test` / `admin123` (or `sales@zobra.com` / `password123`).
   - Navigate to **Inquiries** (`/dashboard/inquiries`).
   - Click the newly created inquiry row to open the Right Drawer.
   - Inspect all captured customer & product specification fields.
   - Test adding an internal note.

3. **Convert to Quote**:
   - In the Drawer, click **Convert to Quote**.
   - You will be automatically redirected to `/dashboard/quotes/<quote-id>`.
   - Verify Quote line items contain the product, quantity (100), color, size, and print type.
   - Verify subtotal, GST (18%), and grand total are properly calculated.

4. **Verify Status**:
   - Return to `/dashboard/inquiries` and observe the inquiry status is now **Converted**.
