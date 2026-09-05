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
