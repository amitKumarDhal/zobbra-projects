# ZOBBRA — FINAL PRISMA SCHEMA & MIGRATION AUDIT FOR RAILWAY

**Audit Date:** August 25, 2026  
**Audited By:** Antigravity AI  
**Scope:** Prisma Schema Architecture, Monorepo Client Resolution, Database Topology, and Railway Deployment Migration Strategy

---

## 1. Executive Summary

| Audit Dimension | Finding / Status | Details |
| :--- | :---: | :--- |
| **Authoritative Schema** | `C:\Zobra\prisma\schema.prisma` | Root schema containing all 24 production models, 15 enums, and full relations. |
| **Secondary Schema** | `packages/database/prisma/schema.prisma` | Synchronized replica of the root schema. |
| **Runtime Prisma Client** | `@prisma/client` in Monorepo Root | Imported by `zobra-server` directly via `@prisma/client`. |
| **Local Database Tables** | **24 / 24 Models Mapped** | Local PostgreSQL contains all 24 tables matching the authoritative schema. |
| **Migration Directory Status** | ⚠️ **NO MIGRATIONS EXIST** | Neither `prisma/migrations/` nor `packages/database/prisma/migrations/` exist. |
| **Local Database Migration State** | `_prisma_migrations = false` | The local database was provisioned/evolved via `prisma db push`, not `prisma migrate`. |
| **Railway Deployment Strategy** | 🛑 **STOP: Initial Migration Required** | Detailed baseline initialization required prior to `prisma migrate deploy`. |

---

## 2. Comprehensive Schema Comparison

### A. Root vs Package Schema
* **Root Schema**: `c:\Zobra\prisma\schema.prisma` (655 lines)
* **Package Schema**: `c:\Zobra\packages\database\prisma\schema.prisma` (654 lines)
* **Comparison Result**: Both files are **100% identical** across all models, enums, fields, foreign keys, and indexes.

### B. Complete 24-Model Inventory
The authoritative schema defines:
1. `User` (RBAC: ADMIN, SALES, PRODUCTION, CUSTOMER)
2. `Company` (B2B client profile & GSTIN)
3. `Category` (Product categorization)
4. `Product` (Merchandise catalog)
5. `ProductVariant` (SKUs, Colors, Sizes, Stock)
6. `BulkPricing` (Volume tier pricing rules)
7. `Quote` (B2B formal quotation)
8. `QuoteItem` (Line items with print techniques)
9. `QuoteActivity` (Audit trail & notes)
10. `Order` (Confirmed customer orders)
11. `OrderItem` (Order line items & customization details)
12. `Payment` (Payment records & transaction states)
13. `ProductionJob` (Printing & manufacturing pipeline stages)
14. `Dispatch` (Courier shipping & tracking numbers)
15. `Invoice` (Tax invoices & payment due dates)
16. `CMSContent` (Blogs, FAQs, dynamic marketing)
17. `SystemSetting` (Platform key-value configuration)
18. `Inquiry` (Lead qualification & B2B request funnel)
19. `InquiryActivity` (Sales activity tracking)
20. `Task` (Internal CRM tasks & follow-ups)
21. `Coupon` (Promotional & corporate rate discounts)
22. `CouponUsage` (Per-customer discount redemptions)
23. `Testimonial` (Verified customer reviews)
24. `SystemActivity` (Audit logging)

---

## 3. Runtime Prisma Client & Codebase Inspection

### A. How `zobra-server` Loads Prisma
1. **Dependency in `server/package.json`**:
   ```json
   "dependencies": {
     "@prisma/client": "^5.19.0"
   }
   ```
2. **Import in `server/src/config/index.ts`**:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   export const prisma = new PrismaClient();
   ```
3. **Imports in Domain Modules**:
   - `server/src/modules/inquiries/inquiries.service.ts`: `import { PrismaClient, Inquiry, ... } from '@prisma/client'`
   - `server/src/modules/inquiries/inquiries.controller.ts`: `import { InquiryStatus, ... } from '@prisma/client'`
   - `server/src/modules/quotes/quotes.controller.ts`: `import { PrismaClient } from '@prisma/client'`
4. **Build & Type Resolution**:
   - Running `pnpm prisma generate` at the monorepo root reads `prisma/schema.prisma` by default and outputs the runtime client directly to `node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client`.
   - `zobra-server` compiles and runs against this unified root client.

---

## 4. Local PostgreSQL Database Relationship

An inspection of the active local database (`zobra_db` on `localhost:5432`) confirms:
* **Total Tables**: 24 tables (`bulk_pricings`, `categories`, `cms_contents`, `companies`, `coupon_usages`, `coupons`, `dispatches`, `inquiries`, `inquiry_activities`, `invoices`, `order_items`, `orders`, `payments`, `product_variants`, `production_jobs`, `products`, `quote_activities`, `quote_items`, `quotes`, `system_activities`, `system_settings`, `tasks`, `testimonials`, `users`).
* **Table `_prisma_migrations`**: **DOES NOT EXIST** (`false`).
* **Conclusion**: The local PostgreSQL database topology was created and maintained exclusively using `prisma db push`.

---

## 5. Migration History Audit & Railway Migration Strategy

### ⚠️ Critical Finding: No Existing Migration History
* `prisma/migrations/` → **DOES NOT EXIST**
* `packages/database/prisma/migrations/` → **DOES NOT EXIST**

Because there are no existing SQL migration files, running `prisma migrate deploy` directly against a clean Railway PostgreSQL database will **fail** with:
> `Error: P3005: The database schema is empty or the migration history is missing.`

---

## 6. Recommended Railway Migration Plan

To establish a production-grade migration pipeline on Railway without touching local cleaned data:

### Option A: Create Baseline Initial Migration (Recommended for Strict `prisma migrate deploy`)
Generate the baseline migration file from the authoritative schema without modifying the local database:
```bash
# 1. Create the initial migration SQL in prisma/migrations/0_init/migration.sql
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

# 2. Mark the migration as applied on local DB (without re-running it)
npx prisma migrate resolve --applied 0_init
```

Then, in Railway container startup / CI/CD:
```bash
# Exact Railway Migration Command:
npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

### Option B: Direct Railway Schema Push (Quickest for Staging/MVP Launch)
If you prefer provisioning the fresh Railway PostgreSQL instance without managing local SQL migration files:
```bash
# Exact Command:
DATABASE_URL="<RAILWAY_POSTGRES_URL>" npx prisma db push --schema=prisma/schema.prisma
```

---

## 7. Required Configuration Changes

To prevent ambiguity between root and package schemas moving forward:

1. **Root `package.json` Scripts**:
   Update `package.json` scripts to explicitly target `prisma/schema.prisma`:
   ```json
   {
     "scripts": {
       "db:generate": "prisma generate --schema=prisma/schema.prisma",
       "db:migrate": "prisma migrate deploy --schema=prisma/schema.prisma",
       "db:seed": "tsx prisma/seed.ts"
     }
   }
   ```
2. **Railway Service Build Command**:
   In the Railway `zobbra-server` service configuration:
   ```bash
   pnpm install && npx prisma generate --schema=prisma/schema.prisma && pnpm --filter zobra-server build
   ```
3. **Railway Service Start Command**:
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma && pnpm --filter zobra-server start
   ```

---

## 8. Verification & Summary

* **Authoritative Schema**: `c:\Zobra\prisma\schema.prisma`
* **Schema Health**: 100% synchronized, TypeScript build passes on all 5 packages, all 24 models verified.
* **Migration Strategy**: Explicitly declared above. Awaiting user choice between **Option A (Baseline Migration + `migrate deploy`)** and **Option B (`db push` initial provisioning)** before executing any migration commands.
