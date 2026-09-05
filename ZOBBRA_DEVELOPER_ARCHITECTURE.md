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
