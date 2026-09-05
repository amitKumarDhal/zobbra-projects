# ZOBBRA Developer Architecture & System Overview

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.

## 1. Executive Summary
ZOBBRA is a Modern B2B Merchandise Management SaaS. It consists of a public-facing website and an authenticated dashboard for customers, sales, production, and admins.
- **Frontend**: Next.js 14 App Router (apps/web)
- **Backend**: Express REST API Server (server)
- **Database**: PostgreSQL with Prisma ORM (server/prisma)
- **Deployment**: Railway

## 2. System Architecture
### Repository Structure (Turborepo)
- `apps/web`: The Next.js frontend application (active).
- `server`: The backend Express application (active).
- `packages/*`: Shared utilities and database.

### Browser → API → DB Flow
```
User Browser -> Next.js (apps/web) -> Express API (server) -> Prisma -> PostgreSQL
```

## 3. Frontend Architecture (`apps/web`)
The frontend uses Next.js 14 App Router, Tailwind CSS, shadcn/ui, and TanStack Query.
- **Public Routes**: `/(public)` - Includes Home, About, Contact, Products, FAQ.
- **Auth Routes**: `/(auth)` - Login, Register, Forgot Password.
- **Customer Routes**: `/customer` - Dashboard for registered clients.
- **Admin Routes**: `/dashboard` - Dashboard for ADMIN, SALES, PRODUCTION roles.
- **API Client**: `apps/web/src/lib/api.ts` centralizes all API calls.

## 4. Backend Architecture (`server`)
The backend is an Express server structured into domain-driven modules:
- Entry point: `server/src/app.ts`
- Routes: `server/src/modules/<domain>/<domain>.routes.ts`
- Middleware: Authentication (`authenticateJWT`), Authorization (`authorizeRoles`), Error Handling (`errorHandler.ts`).

## 5. Deployment & Configuration
- **Platform**: Railway
- **Frontend URL**: https://zobbra.com (and app.zobbra.com)
- **Backend URL**: https://zobra-server-production.up.railway.app
- **Next.js Skew Protection**: Configured via `RAILWAY_DEPLOYMENT_ID` in `next.config.js`.

## 6. Authentication & Authorization
- **Authentication**: JWT-based. Handled via `auth.controller.ts`.
- **Authorization**: Middleware checks roles (ADMIN, SALES, PRODUCTION, CUSTOMER).

## 7. Reliability & Error Handling
- **Frontend**: Centralized error classification in `api.ts`.
- **Backend**: Global `errorHandler` middleware. Process-level `uncaughtException` catches.
- **CORS**: Explicit whitelist including `https://zobbra.com`.

## 8. Frontend Deep Dive
- **Design System**: Tailwind CSS with custom branding configured in `tailwind.config.js`.
- **Testing**: Vitest for unit tests, Cypress for E2E tests (`test:cypress`).

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.
# ZOBBRA API Reference

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.

## Overview
The ZOBBRA API is a RESTful service.
Base URL: `https://zobra-server-production.up.railway.app/api/v1`

## API Endpoints

### Auth
- `POST /auth/register` (Public) - Register a new user
- `POST /auth/login` (Public) - Login
- `POST /auth/forgot-password` (Public) - Forgot password
- `POST /auth/change-password` (Auth required) - Change password
- `GET /auth/me` (Auth required) - Get current user

### Products
- `GET /products` (Public) - List products
- `GET /products/categories` (Public) - List categories
- `GET /products/:slug` (Public) - Get product details
- `POST /products` (ADMIN/SALES) - Create product
- `PUT /products/:id` (ADMIN/SALES) - Update product
- `POST /products/:id/duplicate` (ADMIN/SALES) - Duplicate product
- `DELETE /products/:id` (ADMIN/SALES) - Delete product

### Quotes
- `GET /quotes` (Auth required) - List quotes
- `POST /quotes/calculate` (ADMIN/SALES) - Calculate pricing
- `GET /quotes/:id` (Auth required) - Get quote details
- `POST /quotes` (Auth required) - Create quote
- `PUT /quotes/:id` (ADMIN/SALES) - Edit quote
- `PUT /quotes/:id/status` (Auth required) - Update status
- `GET /quotes/:id/pdf` (Auth required) - Download quote PDF
- `POST /quotes/:id/email` (Auth required) - Email quote
- `POST /quotes/:id/whatsapp` (ADMIN/SALES) - Send WhatsApp link

### Orders
- `GET /orders` (Auth required) - List orders
- `GET /orders/:id` (Auth required) - Get order details
- `POST /orders/from-quote/:quoteId` (Auth required) - Convert quote to order
- `PUT /orders/:id/status` (ADMIN/SALES/PRODUCTION) - Update order status

### Invoices
- `GET /invoices` (Auth required) - List invoices
- `GET /invoices/:id` (Auth required) - Get invoice details
- `GET /invoices/:id/pdf` (Auth required) - Download invoice PDF

### Production
- `GET /production/kanban` (ADMIN/PRODUCTION/SALES) - List jobs
- `PUT /production/:id/stage` (ADMIN/PRODUCTION) - Update stage

### Dispatch
- `GET /dispatch` (ADMIN/SALES/PRODUCTION) - List dispatches
- `POST /dispatch` (ADMIN/PRODUCTION) - Create dispatch
- `GET /dispatch/track/:shipmentNumber` (Public) - Track shipment

### Inquiries
- `GET /inquiries` (ADMIN/SALES) - List inquiries
- `POST /inquiries` (Public) - Create inquiry
- `POST /inquiries/:id/convert-to-quote` (ADMIN/SALES) - Convert inquiry to quote

### Payments
- `POST /payments/create-order` (Auth required) - Create Razorpay order
- `POST /payments/verify` (Auth required) - Verify payment
- `POST /payments/webhook` (Public) - Webhook
- `GET /payments` (ADMIN/SALES) - List payments
- `POST /payments/record` (ADMIN/SALES) - Record manual payment

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.
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
# ZOBBRA Developer Onboarding Guide

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.

## Welcome to ZOBBRA
This guide covers Day 1 setup for running the ZOBBRA monorepo locally.

## Setup Requirements
1. **Node.js**: v20+
2. **Package Manager**: pnpm (v10+)
3. **Database**: PostgreSQL (v15+)

## Day 1 Setup
### 1. Clone & Install
```bash
git clone <repository_url>
cd Zobra
pnpm install
```

### 2. Environment Variables
Create `.env` files for both the frontend and backend.
- `server/.env` (Database URL, JWT Secret)
- `apps/web/.env.local` (Next.js public API URL)

*Do not commit `.env` files. Reference Railway for production keys.*

### 3. Database Initialization
```bash
# Generate the Prisma Client
pnpm db:generate

# Push the schema to your local database
pnpm db:push

# Seed the database with the initial Admin user
pnpm db:seed
```

### 4. Running the Development Servers
You can run the entire turborepo at once:
```bash
pnpm dev
```
Or run them individually:
- **Frontend**: `pnpm --filter web dev` (runs on http://localhost:3000)
- **Backend**: `pnpm --filter zobra-server dev` (runs on http://localhost:5000)

## Production Debugging Guide
- **Login Fails**: Check `server/.env` for `JWT_SECRET` and ensure the database is running. Check `apps/web/src/lib/api.ts` logs for CORS/network errors.
- **API Unreachable (CORS)**: The backend explicitly restricts CORS in `server/src/app.ts`. Ensure your local URL is whitelisted.
- **Server Action/Version Skew Error**: If Next.js throws an error about missing chunks during a deployment, this is intentional version-skew protection triggered by `RAILWAY_DEPLOYMENT_ID`. The browser should automatically hard refresh.
- **Wrong Sidebar Counts**: Look at `server/src/modules/reports/reports.controller.ts` `getSidebarCounts`. Counts are derived dynamically from Prisma `count()` queries based on status enums.

## Important File Map
- **Frontend API Config**: `apps/web/src/lib/api.ts`
- **Frontend Header**: `apps/web/src/components/shared/PublicHeader.tsx`
- **Backend Entrypoint**: `server/src/app.ts`
- **Backend Routes**: `server/src/modules/<domain>/<domain>.routes.ts`
- **Database Schema**: `prisma/schema.prisma`

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.
