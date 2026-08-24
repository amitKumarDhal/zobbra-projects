# 🔍 ZOBBRA B2B SaaS — Quote Integration Audit

**Date**: 2026-08-08  
**Auditor**: Senior Full-Stack Engineer & QA Engineer  
**Scope**: Full Backend Audit of Database Models, Express API Endpoints, JWT Authentication, Customer Ownership Rules, Pricing Calculation, and Quote State Transitions.

---

## 1. Database Schema & Prisma Models (`prisma/schema.prisma`)

The Prisma schema defines the complete database representation for quotes and associated entities:

```prisma
enum QuoteStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
  EXPIRED
}

model Quote {
  id          String      @id @default(uuid())
  quoteNumber String      @unique
  customerId  String
  customer    User        @relation(fields: [customerId], references: [id])
  companyId   String?
  company     Company?    @relation(fields: [companyId], references: [id])
  status      QuoteStatus @default(DRAFT)
  subtotal    Float
  gstTotal    Float
  discount    Float       @default(0.0)
  totalAmount Float
  notes       String?
  validUntil  DateTime
  items       QuoteItem[]
  order       Order?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@map("quotes")
}

model QuoteItem {
  id          String   @id @default(uuid())
  quoteId     String
  quote       Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  printType   String   @default("Front Only")
  color       String   @default("Black")
  size        String   @default("L")
  quantity    Int
  unitPrice   Float
  totalPrice  Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("quote_items")
}
```

---

## 2. API Endpoints Audit (`server/src/modules/quotes/quotes.routes.ts`)

| HTTP Method | Route Endpoint | Target Controller | Access Control | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/quotes` | `getQuotes` | JWT (`CUSTOMER`, `ADMIN`, `SALES`) | List quotes (filtered by customer ownership if role is `CUSTOMER`). |
| `GET` | `/api/v1/quotes/:id` | `getQuoteById` | JWT (`CUSTOMER`, `ADMIN`, `SALES`) | Fetch single quote details with line items and product details. |
| `POST` | `/api/v1/quotes` | `createQuote` | JWT (`CUSTOMER`, `ADMIN`, `SALES`) | Create a new quotation, calculate subtotal & 5% GST server-side. |
| `PUT` | `/api/v1/quotes/:id/status` | `updateQuoteStatus` | JWT (`ADMIN`, `SALES`, `CUSTOMER`) | Update status (`APPROVED`, `REJECTED`, `SENT`). Validates state transition server-side. |
| `GET` | `/api/v1/quotes/:id/pdf` | `downloadQuotePDF` | JWT | Stream dynamic PDF quotation document. |
| `POST` | `/api/v1/quotes/:id/email` | `emailQuote` | JWT (`ADMIN`, `SALES`) | Send transactional quote email with PDF attachment via Resend API. |

---

## 3. Customer Ownership & Security Rules

- **`CUSTOMER` Role**:
  - `GET /api/v1/quotes` automatically applies filter: `WHERE customerId = req.user.id OR companyId = req.user.companyId`.
  - Customers cannot query, view, or update another company's quotes.
  - Submissions set `customerId` from `req.user.id` and `companyId` from `req.user.companyId`.
- **`ADMIN` / `SALES` Role**:
  - Unrestricted query access across all corporate accounts. Can filter by `status` query parameter.
  - Can approve, reject, or convert quotes to active orders.

---

## 4. Server-Side Authoritative Pricing Calculation Engine

Frontend client estimates are display-only. The server recalculates and enforces exact pricing:
1. **Product Base Unit Price**: Fetched from DB `Product.basePrice`.
2. **Custom Print Position Addon**:
   - `Front Only` / `Back Only`: +₹20 / pc.
   - `Front & Back Print`: +₹40 / pc.
   - `Embroidery`: +₹30 / pc.
3. **Volume Tier Price Adjustment**: Bulk pricing rules automatically selected based on quantity bracket (`20-49 Pcs`, `50-99 Pcs`, `100-499 Pcs`, `500+ Pcs`).
4. **GST Calculation**: `gstTotal = subtotal * (product.gstRate / 100)` (Default 5% GST for Indian textiles/garments).
5. **Grand Total**: `totalAmount = subtotal + gstTotal - discount`.

---

## 5. Quote State Machine Transitions

```
[ DRAFT ] ➔ [ SENT ] ➔ [ APPROVED ] or [ REJECTED ] ➔ [ CONVERTED TO ORDER ]
```
- **Allowed Transitions**:
  - `DRAFT` ➔ `SENT` (or `UNDER_REVIEW`)
  - `SENT` ➔ `APPROVED` or `REJECTED`
  - `APPROVED` ➔ `CONVERTED TO ORDER`
- Invalid transitions (e.g. `REJECTED` ➔ `APPROVED` without revision, or skipping `SENT`) are rejected with `HTTP 400 Bad Request`.

---

## 6. Real Backend Integration Plan

- **`packages/database`**: Align Prisma schema to ensure `@zobra/database` exports full `Quote`, `QuoteItem`, `Product`, `User`, `Company` types and Prisma client methods.
- **`server` / `packages/api`**: Enhance `quotes.controller.ts` with strict Zod validation, server-side pricing engine, and state machine guards.
- **`apps/web`**: Wire React Query API hooks in `apps/web/src/lib/api-client.ts` for real `POST /api/v1/quotes`, `GET /api/v1/quotes`, and `PUT /api/v1/quotes/:id/status`.
- **`cypress`**: Create `apps/web/cypress/e2e/real_quote_journey.cy.ts` to test real API + PostgreSQL persistence.
