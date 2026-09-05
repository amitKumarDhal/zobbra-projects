# ZOBBRA Data Dictionary

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.

## Overview
ZOBBRA uses PostgreSQL and Prisma ORM.

## Core Models

### User
- **Purpose**: Represents all actors (Customers, Admins, Sales, Production, Agents).
- **Key Fields**: `id`, `email`, `password`, `role` (ADMIN, SALES, PRODUCTION, CUSTOMER, AGENT).
- **Relations**: Associated with Company, Quotes, Orders, Tasks.

### Company
- **Purpose**: Represents a B2B client company.
- **Key Fields**: `id`, `name`, `industry`, `gstNumber`.
- **Relations**: Linked to Users, Quotes, Orders.

### Product
- **Purpose**: The catalog items available for order.
- **Key Fields**: `id`, `title`, `slug`, `basePrice`, `colors`, `sizes`.

### Inquiry
- **Purpose**: A request from a potential or existing customer.
- **Key Fields**: `id`, `inquiryNumber`, `status` (NEW, ASSIGNED, QUOTED, REJECTED, CONVERTED).
- **Relations**: Can be converted into a Quote (`quoteId`).

### Quote
- **Purpose**: A pricing proposal sent to a customer.
- **Key Fields**: `id`, `quoteNumber`, `status` (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED).
- **Relations**: Has many `QuoteItem`, belongs to `User`.

### Order
- **Purpose**: An accepted Quote that is now being fulfilled.
- **Key Fields**: `id`, `orderNumber`, `status` (PENDING, CONFIRMED, IN_PRODUCTION, READY_FOR_DISPATCH, DISPATCHED, DELIVERED, CANCELLED).
- **Relations**: Linked to `Quote`, `User`, `Invoice`, `ProductionJob`, `Dispatch`.

### ProductionJob
- **Purpose**: Tracks the manufacturing status of an order.
- **Key Fields**: `id`, `stage` (PENDING, MATERIAL_SOURCING, PRINTING, QUALITY_CHECK, PACKAGING, COMPLETED).

### Dispatch
- **Purpose**: Tracks the shipping status of an order.
- **Key Fields**: `id`, `shipmentNumber`, `courierName`, `trackingNumber`, `status`.

### Invoice
- **Purpose**: Billing record.
- **Key Fields**: `id`, `invoiceNumber`, `totalAmount`, `status` (UNPAID, PARTIAL, PAID).

## Entity Relationship Overview
```text
User -> Company
User -> Inquiry -> Quote -> Order -> ProductionJob -> Dispatch -> Invoice
Product -> QuoteItem / OrderItem
```

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.
