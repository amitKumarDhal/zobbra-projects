# ZOBBRA COMPLETE ORDER FLOW AUDIT

## 1. Executive Summary
This document is a comprehensive, read-only source-code audit of the ZOBBRA order workflow. It traces the lifecycle from Customer login, through quotation, order conversion, payment, production, dispatch, and delivery. 

## 2. Customer Journey
1. **Login**: `/login`
2. **Quote Creation**: `/customer/create-quote` (Yields `DRAFT` quote)
3. **Review**: `/customer/quotes` (Views quote once Admin marks it `SENT`)
4. **Approval**: Customer approves quote inline (`APPROVED` status)
5. **Conversion**: Customer converts to order (`POST /api/v1/orders/from-quote/:id`)
6. **Payment**: Razorpay checkout initiates on `/customer/orders`
7. **Tracking**: Customer monitors status in `/customer/orders/[id]` and views Invoices at `/customer/invoices`.

## 3. Admin Journey
1. **Quote Review**: `/dashboard/quotes`. Views `DRAFT` quotes.
2. **Pricing**: Admin sets product price, colors, sizes, and shipping.
3. **Send**: Admin updates status to `SENT`.
4. **Order Management**: `/dashboard/orders`. Sees `PENDING` order once customer converts.
5. **Confirmation**: Admin marks `CONFIRMED`.
6. **Production & Logistics**: Updates status to `IN_PRODUCTION`, then `READY_FOR_DISPATCH`, then `DISPATCHED`, and finally `DELIVERED`.

## 4. Login/Auth
- **Endpoint**: `POST /api/v1/auth/login`
- **Mechanism**: Validates credentials via `prisma.user.findUnique({ where: { email } })`. 
- **Token**: Issues JWT token storing `id`, `role`, `companyId`. Token is passed in `Authorization: Bearer <token>`.
- **Role Enforcement**: `authenticateJWT` and `authorizeRoles` middlewares protect endpoints.

## 5. Quote Creation
- **UI**: `/customer/create-quote` or `/get-quote`.
- **API**: `POST /api/v1/quotes` (or `/inquiries` for guests).
- **Backend Behavior**: Looks up real `productId` (no fake products created anymore). Creates a `Quote` and `QuoteItem` with `status: 'DRAFT'`.
- **Association**: `customerId` and `companyId` are extracted from the JWT.

## 6. Quote Approval
- **Endpoint**: `PATCH /api/v1/quotes/:id/status`
- **Authorization**: Checks if `req.user.id == quote.customerId` or company IDs match. Validates that Customers can only send `APPROVED` or `REJECTED`.
- **Result**: Quote status changes to `APPROVED`. `QuoteActivity` is logged.

## 7. Quote → Order Conversion
- **Endpoint**: `POST /api/v1/orders/from-quote/:quoteId`
- **Validation**: Quote must be `APPROVED`. Cannot be converted twice (`409 Conflict` check). Quote must have items and a total > 0.
- **Database Action**: Executes an atomic `$transaction` to create the `Order`, `OrderItem`, `ProductionJob` (`PENDING`), and `Invoice` (`UNPAID`).

## 8. Order Lifecycle
- **Transitions**: `PENDING` → `CONFIRMED` → `IN_PRODUCTION` → `READY_FOR_DISPATCH` → `DISPATCHED` → `DELIVERED`.
- **Direct Jumps**: Prohibited. `ALLOWED_ORDER_TRANSITIONS` explicitly prevents jumping from `CONFIRMED` straight to `DELIVERED`.

## 9. Payment
- **Initiation**: `POST /api/v1/payments/create-order`. Uses Razorpay SDK to generate an `order_id`. Creates a `Payment` record with status `PENDING`.
- **Verification**: `POST /api/v1/payments/verify`. Receives `razorpay_signature`. Validates using HMAC SHA256 and `RAZORPAY_KEY_SECRET`. Updates `Payment` to `COMPLETED` and `Order.paymentStatus` to `PAID`.

## 10. Production
- **Model**: `ProductionJob` (linked via `orderId`).
- **Status**: Admin UI updates the order status to `IN_PRODUCTION`, which triggers stage updates in the Production Job tracker.

## 11. Dispatch
- **Model**: `Dispatch` (linked via `orderId`).
- **Trigger**: Once an order hits `DISPATCHED`, tracking numbers and courier names are attached.

## 12. Delivery
- **Trigger**: Admin updates Order status to `DELIVERED`. Updates the `Dispatch` record with `deliveredAt` timestamp.

## 13. Invoice
- **Generation**: A database `Invoice` is created instantly upon Order conversion (`UNPAID` status).
- **PDF**: Dynamically generated via `GET /api/v1/invoices/:id` using `generateInvoicePDFBuffer`. Not stored physically on disk.

## 14. Notifications
- **Mechanisms**: Heavily relies on database Activity tables (`QuoteActivity`, `InquiryActivity`, `SystemActivity`).
- **External**: Triggers exist for WhatsApp (`/whatsapp` endpoint) and email (`/email`), requiring actual provider integrations.

## 15. Database Relationship Map
User (Customer) → [1:M] → Quote
Company → [1:M] → Quote
Quote → [1:M] → QuoteItem
Quote → [1:1] → Order (via quoteId)
Order → [1:M] → OrderItem
Order → [1:1] → ProductionJob
Order → [1:1] → Dispatch
Order → [1:M] → Payment
Order → [1:M] → Invoice

## 16. Authorization Matrix
- **Create Quote**: Customer, Sales, Admin
- **Approve/Reject Quote**: Customer (Must own Quote)
- **Edit Pricing**: Sales, Admin
- **Convert to Order**: Customer (Must own Quote)
- **Update Order Status**: Sales, Admin
- **Download Invoice**: Customer (Must own Order), Sales, Admin

## 17. API Endpoint Map
- `POST /api/v1/quotes` (Create)
- `PUT /api/v1/quotes/:id` (Admin Edit)
- `PATCH /api/v1/quotes/:id/status` (Update Status)
- `POST /api/v1/orders/from-quote/:id` (Convert)
- `POST /api/v1/payments/create-order` (Pay Init)
- `POST /api/v1/payments/verify` (Pay Verify)

## 18. Field Mapping (Quote to Order)
- `Quote.id` → `Order.quoteId`
- `Quote.subtotal` → `Order.subtotal`
- `Quote.gstTotal` → `Order.gstTotal`
- `Quote.totalAmount` → `Order.totalAmount`
- `QuoteItem.productId` → `OrderItem.productId`
- `QuoteItem.quantity` → `OrderItem.quantity`
- `QuoteItem.unitPrice` → `OrderItem.unitPrice`

## 19. Failure Paths
- **Duplicate Conversion**: Blocked by unique constraint check in controller (`409 Conflict`).
- **Payment Drop-off**: If checkout fails or closes, the `Payment` remains `PENDING` and the Order remains `PENDING`. Can be retried.
- **Invalid Signature**: If Razorpay hook signature fails, `Payment` becomes `FAILED`. Order remains `PENDING`.

## 20. Duplicate/Race Risks
- **Order Conversion**: Handled cleanly via `$transaction`. Extremely low risk of duplicates.
- **Payment Verification**: Handled securely via HMAC verification.

## 21. Dummy/Hardcoded Data
- **None**: All hardcoded fake quotes and the `polo-200gsm` default fallback product were eliminated in previous cleanup phases. The flow runs purely on real database data.

## 22. End-to-End Success Scenario
1. Customer (`mohan@example.com`) logs in.
2. Selects "Polo" dropdown → creates `DRAFT` Quote.
3. Admin navigates to `/dashboard/quotes`, assigns $10/unit, updates to `SENT`.
4. Customer sees `SENT` on `/customer/quotes`, clicks APPROVE.
5. Customer clicks CONVERT TO ORDER. Order generated as `PENDING`.
6. Customer clicks PAY NOW. Razorpay completes, Order becomes `PAID`.
7. Admin marks `CONFIRMED`.
8. Admin marks `IN_PRODUCTION`.
9. Admin marks `READY_FOR_DISPATCH`.
10. Admin marks `DISPATCHED` (attaches AWB #).
11. Admin marks `DELIVERED`.

## 23. Critical Blockers
- **None Identified**. The business logic from Quote creation down to Delivery completion is intact, strictly validated, and transactional.

## 24. Recommended Fixes
- None at this time. The flow is complete and structurally sound.
