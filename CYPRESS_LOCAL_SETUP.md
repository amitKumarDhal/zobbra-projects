# ZOBBRA Cypress Local Setup Guide

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v20+ |
| pnpm | v10.0.0 |
| PostgreSQL | v15 (via Docker recommended) |
| Docker Desktop | Latest |

---

## Architecture

```
PostgreSQL (port 5432)
       ↓
Express API (port 5000)   ←  server/
       ↓
Next.js Frontend (port 3000)   ←  apps/web/
       ↓
Cypress (headless Electron or Chrome)
```

Cypress tests POST to `http://localhost:5000/api/v1/auth/login` directly  
and visit pages on `http://localhost:3000`.  
**Both services MUST be running before Cypress starts.**

---

## Step 1 — Start PostgreSQL

```powershell
# From the monorepo root
cd C:\Zobra
docker-compose up -d
```

Verify:
```powershell
docker ps
# zobra_postgres should show "healthy"
```

---

## Step 2 — Start Express API (port 5000)

Open a **dedicated terminal** and run:

```powershell
cd C:\Zobra\server
pnpm dev
# or: npx tsx src/app.ts
```

Expected output:
```
🚀 ZOBBRA B2B Server listening on http://localhost:5000
```

Health check:
```powershell
Invoke-RestMethod http://localhost:5000/health
# { status: "ok", service: "ZOBBRA B2B SaaS API" }
```

---

## Step 3 — Start Next.js Frontend (port 3000)

Open a **separate terminal** and run:

```powershell
cd C:\Zobra\apps\web
pnpm dev
# or: next dev -p 3000
```

Expected output:
```
✓ Ready on http://localhost:3000
```

---

## Step 4 — Verify Environment (Preflight Check)

```powershell
cd C:\Zobra\apps\web
node scripts/preflight.js
```

Expected output:
```
🔍 ZOBBRA Preflight Check

  ✅  Next.js Frontend          http://localhost:3000  [200]
  ✅  Express API Health        http://localhost:5000/health  [200]

✅ ZOBBRA TEST ENVIRONMENT READY — you may now run Cypress.
```

**If either check fails, DO NOT run Cypress.** Fix the service first.

---

## Step 5 — Run Cypress

### Option A: Headless Electron (CI-style)
```powershell
cd C:\Zobra\apps\web
npx cypress run
```

### Option B: Headless Chrome
```powershell
cd C:\Zobra\apps\web
npx cypress run --browser chrome
```

### Option C: Interactive UI
```powershell
cd C:\Zobra\apps\web
npx cypress open
```

### Option D: Preflight + Run in one command
```powershell
cd C:\Zobra\apps\web
pnpm test:e2e          # Electron
pnpm test:e2e:chrome   # Chrome
```

---

## Running All 3 Services Together (Alternative)

From the monorepo root, Turborepo starts both services together:

```powershell
cd C:\Zobra
pnpm dev
```

This starts:
- `apps/web` → `next dev -p 3000`
- `server` → `tsx watch src/app.ts` (port 5000)

Note: PostgreSQL must still be started separately via Docker.

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@zobra.test` | `admin123` |
| Customer | `customer@zobra.test` | `customer123` |
| Sales | `sales@zobra.test` | `sales123` |

These are seeded via `packages/database/` seed scripts.

---

## Environment Variables

The Express API reads from `server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/zobra_db"
PORT=5000
JWT_SECRET=<your-secret>
```

The Next.js app reads from `apps/web/.env.local` (if present).  
API base URL is typically `http://localhost:5000` in development (hardcoded via `NEXT_PUBLIC_API_URL` or inline).

---

## Troubleshooting

### ECONNREFUSED 127.0.0.1:5000
- Express API is not running → run `cd C:\Zobra\server && pnpm dev`
- Port 5000 may be blocked → `netstat -ano | findstr :5000`

### ECONNREFUSED 127.0.0.1:3000
- Next.js is not running → run `cd C:\Zobra\apps\web && pnpm dev`

### Prisma / Database errors on API startup
- PostgreSQL not running → `docker-compose up -d` from `C:\Zobra`
- Check `DATABASE_URL` in `server/.env`

### Tests skipped or auth failing
- Run preflight first: `node scripts/preflight.js`
- Ensure test users exist: `pnpm db:seed` from `C:\Zobra`

---

## Spec Suite Summary

| File | Tests | Description |
|---|---|---|
| `authentication.cy.ts` | 8 | Login/register/auth flows |
| `admin_navigation.cy.ts` | 1 | Sidebar navigation |
| `admin_operations.cy.ts` | 5 | Admin CRUD pages |
| `agents_module.cy.ts` | 4 | Agents/Sales team |
| `brand_consistency.cy.ts` | 6 | Brand name checks |
| `coupon_module.cy.ts` | 4 | Coupons dashboard |
| `create_quote_admin.cy.ts` | 2 | Admin quote creation |
| `customer_complete_journey.cy.ts` | 1 | Full customer flow |
| `customer_design_system.cy.ts` | 12 | Design system |
| `customer_module.cy.ts` | 4 | Customer module |
| `customer_portal.cy.ts` | 10 | Customer portal pages |
| `customer_sales_journey.cy.ts` | 1 | Sales journey |
| `inquiry_module.cy.ts` | 3 | Inquiries |
| `order_module.cy.ts` | 4 | Orders pipeline |
| `payment_module.cy.ts` | 4 | Payments |
| `product_experience.cy.ts` | 3 | Product UX |
| `product_module.cy.ts` | 4 | Product CRUD |
| `public_products.cy.ts` | 3 | Public catalog |
| `public_website.cy.ts` | 3 | Public pages |
| `quote_builder.cy.ts` | 3 | Quote builder |
| `quote_module.cy.ts` | 4 | Quote management |
| `quote_to_order.cy.ts` | 1 | Quote→Order flow |
| `razorpay_payment.cy.ts` | 1 | Razorpay flow |
| `real_quote_journey.cy.ts` | 1 | Real quote journey |
| `sales_whatsapp.cy.ts` | 1 | WhatsApp sales |
| `sample.cy.ts` | 1 | Dashboard smoke |
| `settings_module.cy.ts` | 6 | Settings |
| `testimonials_module.cy.ts` | 3 | Testimonials |
| `todo_module.cy.ts` | 5 | To Do tasks |
| `zobra_business_journey.cy.ts` | 1 | Business wizard |
| `zobra_complete_mvp.cy.ts` | 1 | Full MVP flow |
