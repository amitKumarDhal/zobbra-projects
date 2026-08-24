# 🔍 ZOBBRA B2B SaaS — Quote Real Integration Audit

**Date**: 2026-08-08  
**Role**: Senior Full-Stack Engineer + Database Engineer + QA Engineer  
**Scope**: Verification of Real Backend Persistence, Auth Integration, Authoritative Server Pricing, Customer Ownership, Admin Management, and Integration Gaps.

---

## 1. Database Schema & Prisma Models (`prisma/schema.prisma`)

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

## 2. Existing Quote API Endpoints

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/v1/quotes` | `Bearer <JWT>` | Retrieves quotes. Customer gets own records; Admin gets all. |
| `GET` | `/api/v1/quotes/:id` | `Bearer <JWT>` | Single quote detail + item breakdown. Customer ownership checked. |
| `POST` | `/api/v1/quotes` | `Bearer <JWT>` | Creates quote with server-calculated unit rates, GST (5%), & grand total. |
| `PUT` | `/api/v1/quotes/:id/status` | `Bearer <JWT>` | Updates status (`APPROVED`, `REJECTED`, `SENT`). Enforces state machine rules. |
| `GET` | `/api/v1/quotes/:id/pdf` | `Bearer <JWT>` | Generates dynamic PDF quote. |
| `POST` | `/api/v1/quotes/:id/email` | `Bearer <JWT>` | Dispatches quote PDF via transactional email. |

---

## 3. Real vs. UI-Only Status Matrix

| Component / Workflow | Current Frontend Implementation | Required Backend Integration |
|---|---|---|
| **8-Step Configurator (`/customer/create-quote`)** | 🟡 Client React State (`useState`) | 🟢 `POST /api/v1/quotes` with JWT Auth & server-calculated pricing. |
| **Client My Quotes (`/customer/quotes`)** | 🟡 Static Array | 🟢 `GET /api/v1/quotes` filtered by authenticated customer. |
| **Admin Quotes Desk (`/dashboard/quotes`)** | 🟡 Static Array | 🟢 `GET /api/v1/quotes` & `PUT /api/v1/quotes/:id/status`. |
| **Pricing Calculation** | 🟡 Client Math | 🟢 Authoritative Server Calculation (`calculateServerPricing`). |
| **Quote Approval / Rejection** | 🟡 Local State Toggle | 🟢 Server-side status transition with PostgreSQL update. |

---

## 4. Security & Ownership Rules

- **Authentication**: JWT `Authorization: Bearer <token>` in HTTP headers.
- **Customer Ownership Guard**:
  - `GET /api/v1/quotes` enforces `WHERE customerId = req.user.id OR companyId = req.user.companyId`.
  - Customers cannot query, read, or modify quotes belonging to other companies.
- **Price Manipulation Guard**:
  - Server recalculates line item totals, GST, and grand totals directly from product base price in database.
  - Browser-submitted rates are ignored.

---

## 5. Next Architectural Action Plan

1. **Step 1**: Connect `/customer/create-quote` wizard submit handler to call `POST /api/v1/quotes`.
2. **Step 2**: Connect `/customer/quotes` to `GET /api/v1/quotes` and implement live status updates.
3. **Step 3**: Connect `/dashboard/quotes` to `GET /api/v1/quotes` and `PUT /api/v1/quotes/:id/status`.
4. **Step 4**: Add backend Supertest/Jest integration tests for quote creation, pricing, ownership, and invalid status transitions.
5. **Step 5**: Add Cypress E2E real-data test `apps/web/cypress/e2e/real_quote_journey.cy.ts` verifying real PostgreSQL persistence across Customer and Admin views.
