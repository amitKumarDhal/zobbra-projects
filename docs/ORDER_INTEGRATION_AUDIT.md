# 🔍 ZOBBRA B2B SaaS — Order Integration Audit

**Date**: 2026-08-08  
**Auditor**: Senior Full-Stack Engineer + Database Engineer + QA Engineer  
**Scope**: Verification of Existing Order Controllers, Routes, Prisma Schema Models, Security Rules, Status Enum Mapping, and Integration Plan.

---

## 1. Existing Order Database Models (`prisma/schema.prisma`)

```prisma
enum OrderStatus {
  PENDING
  IN_PRODUCTION
  READY_FOR_DISPATCH
  DISPATCHED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
}

model Order {
  id            String          @id @default(uuid())
  orderNumber   String          @unique
  quoteId       String?         @unique
  quote         Quote?          @relation(fields: [quoteId], references: [id])
  customerId    String
  customer      User            @relation(fields: [customerId], references: [id])
  companyId     String?
  company       Company?        @relation(fields: [companyId], references: [id])
  status        OrderStatus     @default(PENDING)
  paymentStatus PaymentStatus   @default(PENDING)
  subtotal      Float
  gstTotal      Float
  totalAmount   Float
  items         OrderItem[]
  production    ProductionJob?
  dispatch      Dispatch?
  invoices      Invoice[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("orders")
}

model OrderItem {
  id                   String   @id @default(uuid())
  orderId              String
  order                Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId            String
  product              Product  @relation(fields: [productId], references: [id])
  printType            String   @default("Front Only")
  color                String   @default("Black")
  size                 String   @default("L")
  quantity             Int
  unitPrice            Float
  totalPrice           Float
  customizationDetails String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("order_items")
}
```

---

## 2. API Endpoints Audit (`server/src/modules/orders/orders.routes.ts`)

| Method | Endpoint | Authorization | Current Status | Required Enhancement |
|---|---|---|---|---|
| `POST` | `/api/v1/orders/from-quote/:quoteId` | `Bearer <JWT>` | 🟡 To be added | Primary conversion route. Enforces `APPROVED` status guard, customer ownership, duplicate check (`409 Conflict`), and atomic `prisma.$transaction`. |
| `POST` | `/api/v1/orders/convert` | `Bearer <JWT>` | 🟡 Basic controller | Kept as alias route mapping to `convertQuoteToOrder`. |
| `GET` | `/api/v1/orders` | `Bearer <JWT>` | 🟢 Active | Retains customer filter (`WHERE customerId = req.user.id OR companyId = req.user.companyId`). |
| `GET` | `/api/v1/orders/:id` | `Bearer <JWT>` | 🟢 Active | Returns order details, item breakdown, production job status, and invoices. |
| `PUT` | `/api/v1/orders/:id/status` | `Bearer <JWT>` | 🟡 Basic controller | Add server-side state machine guard (`PENDING` ➔ `CONFIRMED` ➔ `IN_PRODUCTION` ➔ `READY_FOR_DISPATCH` ➔ `DISPATCHED` ➔ `DELIVERED`). |

---

## 3. Quote to Order Conversion Rules & Security Isolation

1. **Prerequisite**: Quote MUST have `status = APPROVED`. Attempting to convert `DRAFT`, `SENT`, or `REJECTED` quotes returns `HTTP 400 Bad Request`.
2. **Customer Ownership**: If role is `CUSTOMER`, quote MUST belong to `req.user.id` or `req.user.companyId`. Unauthorized conversion attempts return `HTTP 403 Forbidden`.
3. **Duplicate Prevention**: If an `Order` record already references `quoteId`, return `HTTP 409 Conflict` (`Quote #ZQB-1001 has already been converted to an order`).
4. **Atomic Transaction**: Conversion runs in a `prisma.$transaction` creating `Order`, `OrderItems`, `ProductionJob`, and initial `Invoice` atomically. Financial totals (`subtotal`, `gstTotal`, `totalAmount`) are copied verbatim from the approved quote to maintain price integrity.

---

## 4. Frontend Workspace Integration Plan

1. **Quote Desk Button**: Add "CONVERT TO ORDER" action on `/dashboard/quotes` and `/customer/quotes` for approved quotes.
2. **Customer Portal**: Connect `/customer/orders` to `GET /api/v1/orders` to render real PostgreSQL order records and timeline.
3. **Admin Dashboard**: Connect `/dashboard/orders` to `GET /api/v1/orders` & `PUT /api/v1/orders/:id/status`.
4. **Integration Tests**: Write `server/tests/orders.test.ts` (Vitest/Supertest) verifying conversion, pricing copy, conflict 409, and status machine.
5. **Cypress Real Journey**: Create `apps/web/cypress/e2e/quote_to_order.cy.ts` verifying Customer Quote ➔ Admin Approval ➔ Order Conversion ➔ Customer & Admin Synchronization.
