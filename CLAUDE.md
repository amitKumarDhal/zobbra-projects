# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🏗️ Project Overview

**Zobra** is a modern B2B SaaS monorepo for merchandise management, built with a Turborepo architecture. It's a full-stack application for custom apparel, corporate merchandise, and branded product businesses.

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TanStack Query, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Express.js (two implementations: `server/` and `packages/api/`)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **Package Manager**: pnpm 10.0.0 with workspace support
- **Build System**: Turborepo for task orchestration
- **Linting/Formatting**: ESLint, Prettier (Conventional commits with commitlint)
- **Testing**: Jest (backend), Vitest (database), Cypress (E2E)
- **File Uploads**: Cloudinary integration
- **Email**: Resend API
- **Payments**: Razorpay integration
- **PDF Generation**: PDFKit

---

## 📦 Monorepo Structure

```
C:\Zobra\
├── apps/
│   └── web/                          # Next.js 14 frontend (port 3000)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/         # Landing pages: about, contact, industries, products, design-system
│       │   │   ├── (auth)/           # Auth pages: login, register, forgot-password, reset-password
│       │   │   ├── customer/         # Customer portal (CUSTOMER role)
│       │   │   └── dashboard/        # Admin dashboard (ADMIN/SALES roles)
│       │   ├── components/
│       │   │   ├── shared/           # Navbar, Sidebar, Footer, Logo components
│       │   │   ├── landing/          # Hero, CTA, Testimonials, ProductsSection, etc.
│       │   │   ├── dashboard/        # Dashboard-specific components
│       │   │   └── ui/               # shadcn/ui primitives (button, card, input, badge, etc.)
│       │   ├── hooks/                # Custom React hooks
│       │   └── lib/                  # Utilities: api.ts, whatsapp.ts, utils.ts
│       └── tailwind.config.js         # Design system configuration
│
├── packages/
│   ├── api/                          # Express API (legacy, minimal)
│   │   ├── src/
│   │   │   ├── app.ts               # Express setup
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   └── middleware/
│   │   └── jest.config.cjs
│   │
│   ├── database/                     # Prisma schema & seeder
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database models (main authority)
│   │   │   ├── seed.ts              # Development seeder
│   │   │   └── seed_staging.ts      # Railway staging seeder
│   │   ├── src/
│   │   └── tests/
│   │
│   └── shared/                       # Shared TypeScript types & constants
│       └── src/
│           ├── index.ts
│           └── types.ts
│
├── server/                           # Main Express.js backend (port 5000)
│   ├── src/
│   │   ├── app.ts                   # Express app setup & route mounting
│   │   ├── config/index.ts          # Centralized config
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT middleware: authenticateJWT, optionalAuth, authorizeRoles
│   │   │   ├── errorHandler.ts
│   │   │   └── validate.ts
│   │   ├── modules/                 # Feature modules (each has controller + routes)
│   │   │   ├── auth/
│   │   │   ├── agents/
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── quotes/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── inquiries/
│   │   │   ├── invoices/
│   │   │   ├── production/
│   │   │   ├── dispatch/
│   │   │   ├── cms/
│   │   │   ├── coupons/
│   │   │   ├── testimonials/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── tasks/
│   │   └── utils/
│   │       ├── email.ts            # Resend email templates
│   │       ├── pdfGenerator.ts     # PDFKit invoice generation
│   │       └── whatsappTemplates.ts
│   ├── jest.config.cjs
│   └── tests/
│
├── prisma/                           # Root Prisma directory (symlinked by server & packages/database)
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed_staging.ts
│
├── docker-compose.yml                # PostgreSQL local dev setup
├── Dockerfile                        # Production build (Node 20 Alpine)
├── turbo.json                        # Turborepo task configuration
├── pnpm-workspace.yaml               # Workspace packages definition
├── package.json                      # Root monorepo scripts
├── .eslintrc.json                    # ESLint rules
├── .prettierrc                        # Prettier config (100 char line width)
├── commitlint.config.js              # Conventional commits
└── .env.example                      # Environment template

```

---

## 🚀 Common Commands

### Installation & Setup
```bash
# Install dependencies
pnpm install

# Generate Prisma Client (required before dev/build)
pnpm db:generate

# Create PostgreSQL and run migrations (requires docker-compose up or local postgres)
docker-compose up -d
pnpm db:push

# Seed database with admin user
pnpm db:seed
```

### Development
```bash
# Run all dev servers in parallel (web + server)
pnpm dev

# Run individual dev servers
pnpm --filter web dev              # Next.js on http://localhost:3000
pnpm --filter zobra-server dev     # Express on http://localhost:5000

# Access points during development:
# - Web app: http://localhost:3000
# - Dashboard: http://localhost:3000/dashboard (requires ADMIN/SALES role)
# - API health: http://localhost:5000/health
# - API docs: http://localhost:5000/docs (if Swagger enabled)
```

### Building
```bash
# Build entire monorepo
pnpm build

# Build specific package
pnpm --filter web build
pnpm --filter zobra-server build
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @zobra/database test:vitest
pnpm --filter zobra-server test:jest
pnpm --filter web test:vitest

# Run single test file (from package directory)
pnpm test -- path/to/test.ts

# Cypress E2E tests
pnpm test:cypress
pnpm --filter web cypress:open   # Interactive mode
```

### Code Quality
```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Lint & fix specific files
pnpm lint -- --fix
```

### Database
```bash
# Create new migration
pnpm db:migrate

# Generate Prisma Client after schema changes
pnpm db:generate

# Push schema to DB (dev only, no migration files)
pnpm db:push

# Seed database
pnpm db:seed
```

---

## 🔑 Key Architecture Patterns

### Authentication & Authorization
- **Middleware**: `server/src/middleware/auth.ts` exports `authenticateJWT`, `optionalAuth`, `authorizeRoles`
- **Roles**: `ADMIN`, `SALES`, `PRODUCTION`, `CUSTOMER` (defined in Prisma schema)
- **Frontend Check**: Dashboard layout checks `localStorage.getItem('user')` and redirects unauthenticated users to `/login`
- **Backend Check**: Routes use `authenticateJWT` middleware + `authorizeRoles('ADMIN', 'SALES')` guards
- **Token Storage**: Client stores JWT in localStorage after login

### API Communication
- **Central Config**: `apps/web/src/lib/api.ts` exports `API_URL` — **always use this**, never hardcode URLs
- **Environment Variables**: Uses `NEXT_PUBLIC_API_URL` (set by Railway in production)
- **Client**: TanStack Query for state management + Axios for HTTP requests
- **Version**: All routes prefixed with `/api/v1/`

### Module Structure (Backend)
Each module (e.g., `server/src/modules/quotes/`) follows:
```
module/
├── module.controller.ts    # Business logic & DB queries
└── module.routes.ts        # Route definitions & middleware attachment
```
- Controllers export functions, routes import and mount them
- Validation middleware applied at route level
- Error handling centralized in `errorHandler.ts` middleware

### Frontend Layout & Navigation
- **Public Pages**: `apps/web/src/app/(public)/` — shared PublicHeader/PublicFooter
- **Auth Pages**: `apps/web/src/app/(auth)/` — login, register, password reset
- **Customer Portal**: `apps/web/src/app/customer/` — customer-only features (layout checks CUSTOMER role)
- **Admin Dashboard**: `apps/web/src/app/dashboard/` — admin/sales features (layout checks ADMIN/SALES roles)
- **State Closure**: Sidebar closes on mobile when route changes (see `/customer/layout.tsx` and `/dashboard/layout.tsx`)

### Database Schema Highlights
- **Enums**: Role, QuoteStatus, OrderStatus, InquiryStatus, PaymentStatus, ProductionStage, DispatchStatus, TaskPriority, TaskStatus, etc.
- **Multi-tenant Ready**: `Company` model links users, quotes, orders, invoices
- **Activity Tracking**: `QuoteActivity`, `InquiryActivity`, `SystemActivity` for audit trails
- **Polymorphic Tasks**: Tasks can relate to inquiries, quotes, orders, or customers
- **Coupons**: Discount system with per-customer limits and usage tracking
- **Payments**: Razorpay integration (`razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`)

---

## 🎨 Design System & Styling

- **Font Stack**: Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (code)
- **Color Palette**: Primary Blue `#3B6FEB`, Backgrounds `#F8F9FC`, Text `#111111` (light mode)
- **CSS Framework**: Tailwind CSS with custom configuration in `apps/web/tailwind.config.js`
- **UI Components**: shadcn/ui primitives in `apps/web/src/components/ui/` (button, card, input, badge, modal, drawer, skeleton, stat-card, status-badge, command-palette)
- **Icon Library**: Lucide React

---

## 🔐 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL="postgresql://..."
PORT=5000
NODE_ENV=development|production
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
RESEND_API_KEY=<key>
RAZORPAY_KEY_ID=<id>
RAZORPAY_KEY_SECRET=<secret>
```

### Frontend (`NEXT_PUBLIC_*` set by Railway in production)
```env
NEXT_PUBLIC_API_URL=https://zobra-server-production.up.railway.app/api/v1  (production)
# Defaults to http://localhost:5000/api/v1 in development
```

---

## 🧪 Testing Approach

- **Backend API Tests**: Jest + Supertest (`packages/api/`, `server/src/modules/payments/payments.test.ts`)
- **Database Tests**: Vitest (`packages/database/tests/db.test.ts`)
- **Frontend Tests**: Vitest for units, Cypress for E2E
- **Test Location**: Colocate tests with source files or in `tests/` directories

---

## 🐛 Debugging Tips

1. **API Development**: Use `pnpm --filter zobra-server dev` to watch TypeScript in real-time
2. **Database Issues**: Check PostgreSQL is running: `docker-compose ps`
3. **Missing Prisma Client**: Run `pnpm db:generate` before building/testing
4. **Frontend API Errors**: Verify `NEXT_PUBLIC_API_URL` is correct (dev vs. production)
5. **Auth Failures**: Check JWT token in localStorage and backend config

---

## 📋 Code Style & Conventions

- **Formatting**: Prettier (100 char line width, semicolons, trailing commas)
- **Linting**: ESLint with TypeScript support
- **Commits**: Conventional commits enforced by commitlint (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Naming**: camelCase for functions/variables, PascalCase for components/types/classes
- **File Organization**: Group by feature/module, not by type
- **Exports**: Named exports preferred, default exports for pages/layouts in Next.js

---

## 🚢 Deployment

- **Platform**: Railway
- **Frontend**: Next.js build output deployed to Railway
- **Backend**: Express server deployed to Railway
- **Database**: PostgreSQL on Railway (Railway Postgres add-on)
- **Environment**: `NEXT_PUBLIC_API_URL` must be set in Railway env vars for production builds
- **Build Command**: Dockerfile uses `pnpm install --frozen-lockfile` and `pnpm run db:generate` before build

---

## 📚 Additional Resources

- **Prisma Docs**: Database models are in `prisma/schema.prisma` — consult for entity relationships
- **API Routes**: Full list in `server/src/app.ts` — all prefixed with `/api/v1`
- **Design**: Landing page components showcase brand in `apps/web/src/components/landing/`
- **UI Kit**: Reusable components in `apps/web/src/components/ui/`
