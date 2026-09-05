
# ZOBBRA Complete Technical Documentation

## 1. Executive Summary
ZOBBRA is a Modern B2B Merchandise Management SaaS. This document provides the source-of-truth developer architecture.

## 2. Repository Architecture
Turborepo containing:
- `apps/web`: Next.js 14 App Router frontend.
- `server`: Express backend API.
- `packages/database`: Shared Prisma schema.

## 3. Frontend Architecture
Next.js 14 with Tailwind CSS, shadcn/ui, TanStack Query.
API Client located at `apps/web/src/lib/api.ts`.

## 4. Route Map
- `/(public)/*`: Public pages (Home, About, Products).
- `/(auth)/*`: Login, Register, Forgot Password.
- `/customer/*`: Authenticated customer portal.
- `/dashboard/*`: Admin, Sales, and Production portal.

## 5. Backend Architecture
Express.js REST API with modular structure in `server/src/modules`. Uses `cors` explicitly restricted to `zobbra.com`.

## 6. Complete API Reference

### AGENTS
- **GET** `/api/v1/agents/stats`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/agents`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/agents/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PUT** `/api/v1/agents/:id`
  - Auth: Auth Required
  - Roles: ADMIN

### AUTH
- **POST** `/api/v1/auth/register`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/auth/login`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/auth/forgot-password`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/auth/change-password`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/auth/me`
  - Auth: Auth Required
  - Roles: Any

### CMS
- **GET** `/api/v1/cms`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/cms`
  - Auth: Auth Required
  - Roles: ADMIN

### COUPONS
- **GET** `/api/v1/coupons/stats`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/coupons`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/coupons/:id`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/coupons`
  - Auth: Auth Required
  - Roles: Any
- **PUT** `/api/v1/coupons/:id`
  - Auth: Auth Required
  - Roles: Any
- **DELETE** `/api/v1/coupons/:id`
  - Auth: Auth Required
  - Roles: Any

### CUSTOMERS
- **GET** `/api/v1/customers/stats`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/customers`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/customers/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/customers`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PUT** `/api/v1/customers/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES

### DISPATCH
- **GET** `/api/v1/dispatch/track/:shipmentNumber`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/dispatch`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION
- **POST** `/api/v1/dispatch`
  - Auth: Auth Required
  - Roles: ADMIN, PRODUCTION

### INQUIRIES
- **GET** `/api/v1/inquiries/stats`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/inquiries`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/inquiries/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/inquiries`
  - Auth: Public
  - Roles: Any
- **PATCH** `/api/v1/inquiries/:id/status`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PATCH** `/api/v1/inquiries/:id/assign`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/inquiries/:id/activity`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/inquiries/:id/whatsapp`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/inquiries/:id/convert-to-quote`
  - Auth: Auth Required
  - Roles: ADMIN, SALES

### INVOICES
- **GET** `/api/v1/invoices`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/invoices/:id`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/invoices/:id/pdf`
  - Auth: Auth Required
  - Roles: Any

### ORDERS
- **GET** `/api/v1/orders/stats`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/orders`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/orders/:id`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/orders/from-quote/:quoteId`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/orders/convert`
  - Auth: Auth Required
  - Roles: Any
- **PATCH** `/api/v1/orders/:id/status`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION
- **PUT** `/api/v1/orders/:id/status`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION
- **PUT** `/api/v1/orders/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION

### PAYMENTS
- **POST** `/api/v1/payments/create-order`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/payments/verify`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/payments/webhook`
  - Auth: Public
  - Roles: Any
- **GET** `/api/v1/payments/stats`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/payments`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/payments/record`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/payments/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES

### PRODUCTION
- **GET** `/api/v1/production/kanban`
  - Auth: Auth Required
  - Roles: ADMIN, PRODUCTION, SALES
- **PUT** `/api/v1/production/:id/stage`
  - Auth: Auth Required
  - Roles: ADMIN, PRODUCTION

### PRODUCTS
- **GET** `/api/v1/products`
  - Auth: Public
  - Roles: Any
- **GET** `/api/v1/products/stats`
  - Auth: Public
  - Roles: Any
- **GET** `/api/v1/products/categories`
  - Auth: Public
  - Roles: Any
- **GET** `/api/v1/products/:slug`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/products`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PUT** `/api/v1/products/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/products/:id/duplicate`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **DELETE** `/api/v1/products/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES

### QUOTES
- **GET** `/api/v1/quotes/stats`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/quotes`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes/calculate`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/quotes/:id`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes`
  - Auth: Auth Required
  - Roles: Any
- **PUT** `/api/v1/quotes/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PATCH** `/api/v1/quotes/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PATCH** `/api/v1/quotes/:id/edit`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PUT** `/api/v1/quotes/:id/status`
  - Auth: Auth Required
  - Roles: Any
- **PATCH** `/api/v1/quotes/:id/status`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes/:id/activity`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/quotes/:id/whatsapp`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/quotes/:id/pdf`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes/:id/email`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes/:id/apply-coupon`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/quotes/:id/remove-coupon`
  - Auth: Auth Required
  - Roles: Any

### REPORTS
- **GET** `/api/v1/reports/kpis`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION
- **GET** `/api/v1/reports/sales`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/reports/sidebar-counts`
  - Auth: Auth Required
  - Roles: ADMIN, SALES, PRODUCTION

### SETTINGS
- **GET** `/api/v1/settings`
  - Auth: Auth Required
  - Roles: Any
- **POST** `/api/v1/settings`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/settings/users`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/settings/info`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/settings/health`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/settings/activity`
  - Auth: Auth Required
  - Roles: Any

### TASKS
- **GET** `/api/v1/tasks/stats`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/tasks`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **GET** `/api/v1/tasks/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **POST** `/api/v1/tasks`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PUT** `/api/v1/tasks/:id`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PATCH** `/api/v1/tasks/:id/status`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **PATCH** `/api/v1/tasks/:id/assign`
  - Auth: Auth Required
  - Roles: ADMIN, SALES
- **DELETE** `/api/v1/tasks/:id`
  - Auth: Auth Required
  - Roles: ADMIN

### TESTIMONIALS
- **GET** `/api/v1/testimonials/stats`
  - Auth: Auth Required
  - Roles: Any
- **GET** `/api/v1/testimonials`
  - Auth: Public
  - Roles: Any
- **GET** `/api/v1/testimonials/:id`
  - Auth: Public
  - Roles: Any
- **POST** `/api/v1/testimonials`
  - Auth: Auth Required
  - Roles: Any
- **PUT** `/api/v1/testimonials/:id`
  - Auth: Auth Required
  - Roles: Any
- **PATCH** `/api/v1/testimonials/:id/status`
  - Auth: Auth Required
  - Roles: Any
- **DELETE** `/api/v1/testimonials/:id`
  - Auth: Auth Required
  - Roles: Any



## 7. Authentication
JWT-based authentication. `auth.controller.ts` handles registration/login. `authenticateJWT` middleware validates tokens.

## 8. Authorization & Roles
Roles: ADMIN, SALES, PRODUCTION, CUSTOMER, AGENT. Checked via `authorizeRoles` middleware.

## 9. Database Architecture
PostgreSQL via Prisma.

## 10. Prisma Data Dictionary

### User
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| email | String | @unique |
| passwordHash | String |  |
| name | String |  |
| phone | String? |  |
| role | Role | @default(CUSTOMER) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id], onDelete: SetNull) |
| quotes | Quote[] |  |
| orders | Order[] |  |
| assignedJobs | ProductionJob[] | @relation("AssignedProductionUser") |
| activities | QuoteActivity[] |  |
| inquiries | Inquiry[] | @relation("CustomerInquiries") |
| assignedInquiries | Inquiry[] | @relation("AssignedSalesUser") |
| inquiryActivities | InquiryActivity[] |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| assignedTasks | Task[] | @relation("AssignedTasks") |
| createdTasks | Task[] | @relation("CreatedTasks") |
| customerTasks | Task[] | @relation("CustomerTasks") |
| assignedQuotes | Quote[] | @relation("AssignedQuoteUser") |
| assignedOrders | Order[] | @relation("AssignedOrderUser") |
| couponUsages | CouponUsage[] |  |
| isActive | Boolean | @default(true) |
| department | String? |  |
| location | String? |  |
| testimonials | Testimonial[] | @relation("CustomerTestimonials") |
| systemActivities | SystemActivity[] | @relation("UserSystemActivities") |

### Company
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| name | String |  |
| gstin | String? | @unique |
| address | String |  |
| city | String |  |
| state | String |  |
| pincode | String |  |
| logo | String? |  |
| notes | String? |  |
| users | User[] |  |
| quotes | Quote[] |  |
| orders | Order[] |  |
| invoices | Invoice[] |  |
| inquiries | Inquiry[] |  |
| testimonials | Testimonial[] |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Category
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| name | String | @unique |
| slug | String | @unique |
| description | String? |  |
| image | String? |  |
| products | Product[] |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Product
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| name | String |  |
| slug | String | @unique |
| hsnCode | String | @default("6109") |
| gstRate | Float | @default(5.0) |
| description | String |  |
| basePrice | Float |  |
| images | String[] | @default([]) |
| categoryId | String |  |
| category | Category | @relation(fields: [categoryId], references: [id]) |
| isActive | Boolean | @default(true) |
| variants | ProductVariant[] |  |
| bulkPricing | BulkPricing[] |  |
| quoteItems | QuoteItem[] |  |
| orderItems | OrderItem[] |  |
| inquiries | Inquiry[] |  |
| testimonials | Testimonial[] |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### ProductVariant
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| productId | String |  |
| product | Product | @relation(fields: [productId], references: [id], onDelete: Cascade) |
| color | String |  |
| size | String |  |
| sku | String | @unique |
| stock | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### BulkPricing
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| productId | String |  |
| product | Product | @relation(fields: [productId], references: [id], onDelete: Cascade) |
| minQuantity | Int |  |
| maxQuantity | Int |  |
| pricePerUnit | Float |  |
| printType | String | @default("Front Only") |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Quote
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| quoteNumber | String | @unique |
| customerId | String |  |
| customer | User | @relation(fields: [customerId], references: [id]) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id]) |
| status | QuoteStatus | @default(DRAFT) |
| subtotal | Float |  |
| gstTotal | Float |  |
| discount | Float | @default(0.0) |
| totalAmount | Float |  |
| notes | String? |  |
| validUntil | DateTime |  |
| items | QuoteItem[] |  |
| activities | QuoteActivity[] |  |
| tasks | Task[] |  |
| order | Order? |  |
| inquiry | Inquiry? |  |
| assignedToId | String? |  |
| assignedTo | User? | @relation("AssignedQuoteUser", fields: [assignedToId], references: [id]) |
| couponId | String? |  |
| coupon | Coupon? | @relation(fields: [couponId], references: [id], onDelete: SetNull) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### QuoteItem
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| quoteId | String |  |
| quote | Quote | @relation(fields: [quoteId], references: [id], onDelete: Cascade) |
| productId | String |  |
| product | Product | @relation(fields: [productId], references: [id]) |
| printType | String | @default("Front Only") |
| color | String | @default("Black") |
| size | String | @default("L") |
| quantity | Int |  |
| unitPrice | Float |  |
| totalPrice | Float |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### QuoteActivity
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| quoteId | String |  |
| quote | Quote | @relation(fields: [quoteId], references: [id], onDelete: Cascade) |
| userId | String? |  |
| user | User? | @relation(fields: [userId], references: [id], onDelete: SetNull) |
| type | QuoteActivityType | @default(NOTE) |
| message | String |  |
| createdAt | DateTime | @default(now()) |

### Order
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| orderNumber | String | @unique |
| quoteId | String? | @unique |
| quote | Quote? | @relation(fields: [quoteId], references: [id]) |
| customerId | String |  |
| customer | User | @relation(fields: [customerId], references: [id]) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id]) |
| status | OrderStatus | @default(PENDING) |
| paymentStatus | PaymentStatus | @default(PENDING) |
| subtotal | Float |  |
| gstTotal | Float |  |
| totalAmount | Float |  |
| items | OrderItem[] |  |
| production | ProductionJob? |  |
| dispatch | Dispatch? |  |
| invoices | Invoice[] |  |
| payments | Payment[] |  |
| tasks | Task[] |  |
| assignedToId | String? |  |
| assignedTo | User? | @relation("AssignedOrderUser", fields: [assignedToId], references: [id]) |
| couponId | String? |  |
| coupon | Coupon? | @relation(fields: [couponId], references: [id], onDelete: SetNull) |
| discountAmount | Float | @default(0.0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Payment
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| orderId | String |  |
| order | Order | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| razorpayOrderId | String? | @unique |
| razorpayPaymentId | String? | @unique |
| razorpaySignature | String? |  |
| amount | Float |  |
| currency | String | @default("INR") |
| status | PaymentRecordStatus | @default(PENDING) |
| method | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### OrderItem
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| orderId | String |  |
| order | Order | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| productId | String |  |
| product | Product | @relation(fields: [productId], references: [id]) |
| printType | String | @default("Front Only") |
| color | String | @default("Black") |
| size | String | @default("L") |
| quantity | Int |  |
| unitPrice | Float |  |
| totalPrice | Float |  |
| customizationDetails | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### ProductionJob
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| orderId | String | @unique |
| order | Order | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| stage | ProductionStage | @default(PENDING) |
| assignedToId | String? |  |
| assignedTo | User? | @relation("AssignedProductionUser", fields: [assignedToId], references: [id]) |
| notes | String? |  |
| startedAt | DateTime? |  |
| completedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Dispatch
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| orderId | String | @unique |
| order | Order | @relation(fields: [orderId], references: [id], onDelete: Cascade) |
| shipmentNumber | String | @unique |
| courierName | String |  |
| trackingNumber | String |  |
| trackingUrl | String? |  |
| status | DispatchStatus | @default(DISPATCHED) |
| dispatchedAt | DateTime | @default(now()) |
| deliveredAt | DateTime? |  |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Invoice
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| invoiceNumber | String | @unique |
| orderId | String |  |
| order | Order | @relation(fields: [orderId], references: [id]) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id]) |
| amount | Float |  |
| gstAmount | Float |  |
| totalAmount | Float |  |
| dueDate | DateTime |  |
| status | String | @default("UNPAID") |
| pdfUrl | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### CMSContent
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| type | CMSType |  |
| title | String |  |
| slug | String? | @unique |
| content | String |  |
| author | String? |  |
| image | String? |  |
| isPublished | Boolean | @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### SystemSetting
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| key | String | @unique |
| value | String |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Inquiry
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| inquiryNumber | String | @unique |
| customerId | String? |  |
| customer | User? | @relation("CustomerInquiries", fields: [customerId], references: [id]) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id]) |
| productId | String? |  |
| product | Product? | @relation(fields: [productId], references: [id]) |
| customerName | String? |  |
| companyName | String? |  |
| email | String? |  |
| phone | String? |  |
| location | String? |  |
| customerType | String | @default("GUEST") // GUEST or REGISTERED |
| productInterest | String? |  |
| quantity | Int? |  |
| printingType | String? |  |
| printPosition | String? |  |
| colors | String? |  |
| sizes | String? |  |
| artworkUrl | String? |  |
| deliveryDate | DateTime? |  |
| budget | String? |  |
| customizationRequirements | String? |  |
| source | InquirySource | @default(OTHER) |
| message | String? |  |
| status | InquiryStatus | @default(NEW) |
| assignedToId | String? |  |
| assignedTo | User? | @relation("AssignedSalesUser", fields: [assignedToId], references: [id]) |
| quoteId | String? | @unique |
| quote | Quote? | @relation(fields: [quoteId], references: [id]) |
| nextFollowUpAt | DateTime? |  |
| activities | InquiryActivity[] |  |
| tasks | Task[] |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### InquiryActivity
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| inquiryId | String |  |
| inquiry | Inquiry | @relation(fields: [inquiryId], references: [id], onDelete: Cascade) |
| userId | String? |  |
| user | User? | @relation(fields: [userId], references: [id], onDelete: SetNull) |
| type | InquiryActivityType | @default(NOTE) |
| message | String |  |
| createdAt | DateTime | @default(now()) |

### Task
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| title | String |  |
| description | String? |  |
| assignedToId | String? |  |
| assignedTo | User? | @relation("AssignedTasks", fields: [assignedToId], references: [id], onDelete: SetNull) |
| createdById | String |  |
| createdBy | User | @relation("CreatedTasks", fields: [createdById], references: [id]) |
| customerId | String? |  |
| customer | User? | @relation("CustomerTasks", fields: [customerId], references: [id], onDelete: SetNull) |
| inquiryId | String? |  |
| inquiry | Inquiry? | @relation(fields: [inquiryId], references: [id], onDelete: SetNull) |
| quoteId | String? |  |
| quote | Quote? | @relation(fields: [quoteId], references: [id], onDelete: SetNull) |
| orderId | String? |  |
| order | Order? | @relation(fields: [orderId], references: [id], onDelete: SetNull) |
| priority | TaskPriority | @default(MEDIUM) |
| status | TaskStatus | @default(PENDING) |
| category | TaskCategory | @default(FOLLOW_UP) |
| dueAt | DateTime? |  |
| completedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Coupon
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| code | String | @unique |
| name | String |  |
| description | String? |  |
| discountType | CouponType |  |
| discountValue | Float |  |
| minimumOrderAmount | Float? |  |
| maximumDiscount | Float? |  |
| startAt | DateTime |  |
| endAt | DateTime |  |
| usageLimit | Int? |  |
| usageCount | Int | @default(0) |
| perCustomerLimit | Int? |  |
| status | CouponStatus | @default(ACTIVE) |
| createdById | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| quotes | Quote[] |  |
| orders | Order[] |  |
| usages | CouponUsage[] |  |

### CouponUsage
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| couponId | String |  |
| coupon | Coupon | @relation(fields: [couponId], references: [id], onDelete: Cascade) |
| customerId | String |  |
| customer | User | @relation(fields: [customerId], references: [id], onDelete: Cascade) |
| quoteId | String? |  |
| orderId | String? |  |
| discountAmount | Float |  |
| usedAt | DateTime | @default(now()) |

### Testimonial
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| customerId | String? |  |
| customer | User? | @relation("CustomerTestimonials", fields: [customerId], references: [id], onDelete: SetNull) |
| companyId | String? |  |
| company | Company? | @relation(fields: [companyId], references: [id], onDelete: SetNull) |
| productId | String? |  |
| product | Product? | @relation(fields: [productId], references: [id], onDelete: SetNull) |
| customerName | String |  |
| companyName | String? |  |
| designation | String? |  |
| rating | Int | @default(5) |
| content | String | @db.Text |
| avatarUrl | String? |  |
| status | TestimonialStatus | @default(PENDING) |
| isFeatured | Boolean | @default(false) |
| publishedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### SystemActivity
| Field | Type | Modifiers |
|---|---|---|
| id | String | @id @default(uuid()) |
| userId | String? |  |
| user | User? | @relation("UserSystemActivities", fields: [userId], references: [id], onDelete: SetNull) |
| action | String |  |
| entityType | String |  |
| entityId | String? |  |
| message | String |  |
| createdAt | DateTime | @default(now()) |



## 11. Public Website Flow
User -> Next.js SSR -> Product Details -> `/api/v1/products/:slug` -> UI Render.

## 12. Customer Portal Flow
Login -> JWT stored -> Dashboard fetch -> `/api/v1/quotes` etc -> State updated via TanStack Query.

## 13. Admin Portal Flow
Role: ADMIN/SALES -> Dashboard -> Kanban board `/api/v1/production/kanban` -> Mutate stages.

## 14. Inquiry -> Quote
Inquiry submitted via `POST /api/v1/inquiries` -> Admin views -> Admin clicks Convert -> `POST /api/v1/inquiries/:id/convert-to-quote` -> Quote created.

## 15. Quote -> Order
Quote approved by customer -> Admin converts -> `POST /api/v1/orders/from-quote/:quoteId` -> Order status PENDING.

## 16. Order Lifecycle
PENDING -> CONFIRMED -> IN_PRODUCTION -> READY_FOR_DISPATCH -> DISPATCHED -> DELIVERED -> CANCELLED.

## 17. Payments
Razorpay integration. `POST /payments/create-order` -> Webhook `/payments/webhook` updates PaymentStatus to PAID.

## 18. Invoices
Generated upon order confirmation. `GET /invoices/:id/pdf` uses PDFKit.

## 19. Notifications
In-app via SystemActivity.

## 20. Media/File Handling
Uploads stored securely. Images served via CDN/Railway.

## 21. Sidebar Counts
Dynamic counts fetched via `GET /api/v1/reports/sidebar-counts`, running Prisma `.count()` grouped by status.

## 22. Error Handling
Centralized API fetch wrapper in `api.ts` classifies errors (NETWORK_ERROR, INVALID_CREDENTIALS, API_UNAVAILABLE).

## 23. Reliability
Graceful shutdown, `uncaughtException` handling, and explicit health/readiness endpoints (`/health`, `/health/ready`).

## 24. Security
Explicit CORS, parameter validation via Zod schemas (`validateRequest`), JWT signature verification.

## 25. Responsive Architecture
Mobile-first Tailwind CSS. Drawer navigation on mobile, persistent sidebar on desktop.

## 26. Design System
Tailwind tokens, `shadcn/ui` primitives, custom canonical colors.

## 27. Testing
Vitest for unit testing, Cypress for E2E flows (`test:cypress`).

## 28. Deployment
Railway platform. Server deployed to `zobra-server-production.up.railway.app`.

## 29. Railway
Environment variables configured per service.

## 30. DNS / Domain
Frontend: `zobbra.com`.
Backend: `zobra-server-production.up.railway.app`.
Note: `api.zobbra.com` is reserved for a separate Hostinger app.

## 31. Environment Variables
- `DATABASE_URL`: <SECRET> (Runtime)
- `JWT_SECRET`: <SECRET> (Runtime)
- `NEXT_PUBLIC_API_URL`: Build-time
- `RAILWAY_DEPLOYMENT_ID`: Build-time/Runtime skew protection.

## 32. Debugging
- Check Railway logs.
- Next.js skew error? Hard refresh browser.

## 33. Developer Onboarding
`pnpm install`, `pnpm db:generate`, `pnpm dev`.

## 34. Architecture Decisions
Modular backend for scalability. Next.js App router for SEO.

## 35. Known Gaps
Webhook logs could be more persistent.

## 36. Future Recommendations
Implement Redis caching for sidebar counts if traffic scales.

## 37. Source-of-Truth Rules
VERIFIED FROM SOURCE. The code and Prisma schema override this document.
