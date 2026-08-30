# ZOBBRA — RAILWAY MONOREPO BUILD CONFIGURATION FIX REPORT

**Date:** August 25, 2026  
**Status:** `READY FOR RAILWAY STAGING`  
**Author:** Antigravity AI  

---

## 1. Problem Root Cause Analysis

### A. Why Railway Failed with `ERR_PNPM_NO_LOCKFILE`
When the monorepo was connected to Railway, Railway detected the root `Dockerfile` and triggered a Docker build. The existing `Dockerfile` contained:
```dockerfile
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN pnpm install --frozen-lockfile
```
1. **Missing Lockfile**: `pnpm-lock.yaml` was **not copied** into the container image before running `pnpm install --frozen-lockfile`. When `pnpm install --frozen-lockfile` executes without a lockfile present in the container working directory, it immediately aborts with:
   > `ERR_PNPM_NO_LOCKFILE: Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent`
2. **Missing `server/` Directory**: Only `packages/` and `apps/` were copied into the container context. The entire Express backend (`server/`) and Prisma schema (`prisma/`) were completely absent from the build context.
3. **Monolithic Misconfiguration**: The root `Dockerfile` attempted to run `CMD ["pnpm", "dev"]` and expose ports `3000` and `5000` inside a single image rather than deploying **3 isolated, scalable Railway services**.

---

## 2. Final Railway 3-Service Architecture

```
========================================================================================
                                 RAILWAY CLOUD TOPOLOGY
========================================================================================

                                  INTERNET / CLIENTS
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼                                                 ▼
        Service: web (Frontend)                        Service: zobra-server (Backend)
        Framework: Next.js 14                          Framework: Express.js (Node 20)
        Port: 3000                                     Port: 5000
        Docker: apps/web/Dockerfile                    Docker: server/Dockerfile
        (or Native Railpack)                           (or Native Railpack)
                 │                                                 │
                 │ (NEXT_PUBLIC_API_URL)                           │ (DATABASE_URL)
                 └────────────────────────┬────────────────────────┘
                                          ▼
                                Service: PostgreSQL 16
                                Managed Railway Database
                                Variable: ${{Postgres.DATABASE_URL}}
========================================================================================
```

---

## 3. Service Deployment Configuration & Commands

### Service 1: `zobra-server` (Backend)

* **Directory / Context**: Root (`/`)
* **Dedicated Dockerfile**: `server/Dockerfile` (configured with full monorepo context)
* **Native Railpack / Build Command**:
  ```bash
  pnpm install --frozen-lockfile && npx prisma generate --schema=prisma/schema.prisma && pnpm --filter zobra-server build
  ```
* **Native Railpack / Start Command**:
  ```bash
  pnpm --filter zobra-server start
  ```
* **Environment Variables**:
  - `PORT` = `5000` (or Railway auto `$PORT`)
  - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
  - `JWT_SECRET` = `<secure-random-secret>`
  - `NODE_ENV` = `production`

---

### Service 2: `web` (Frontend Next.js)

* **Directory / Context**: Root (`/`)
* **Dedicated Dockerfile**: `apps/web/Dockerfile`
* **Native Railpack / Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter web build
  ```
* **Native Railpack / Start Command**:
  ```bash
  pnpm --filter web start
  ```
* **Environment Variables**:
  - `PORT` = `3000` (or Railway auto `$PORT`)
  - `NEXT_PUBLIC_API_URL` = `https://<zobra-server-domain>.up.railway.app/api/v1`
  - `NODE_ENV` = `production`

---

### Service 3: PostgreSQL (Database Staging Pre-Deploy)

* **Canonical Schema**: `prisma/schema.prisma`
* **Staging Pre-Deploy Command** (Run once or in Railway CLI against Railway Postgres URL):
  ```bash
  npx prisma db push --schema=prisma/schema.prisma
  ```
* **Important Guardrails**:
  - `db push` is **NOT** included in the server start command.
  - `prisma migrate dev` is **NOT** run on Railway.
  - Migration baselines are **NOT** created yet for current staging.

---

## 4. Files Created / Modified

| File | Type | Changes Made |
| :--- | :---: | :--- |
| [server/Dockerfile](file:///c:/Zobra/server/Dockerfile) | `NEW` | Multi-stage Dockerfile copying `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `packages/`, `prisma/`, and `server/`. Builds with frozen lockfile and generates Prisma client. |
| [apps/web/Dockerfile](file:///c:/Zobra/apps/web/Dockerfile) | `NEW` | Multi-stage Dockerfile copying `pnpm-lock.yaml`, `packages/`, and `apps/web/`. Compiles Next.js standalone production bundle. |
| [.dockerignore](file:///c:/Zobra/.dockerignore) | `NEW` | Ignores `node_modules`, `.next`, `dist`, `.git`, `cypress/screenshots`, and `backups/` from container build context. |
| [Dockerfile](file:///c:/Zobra/Dockerfile) | `MODIFIED` | Updated root fallback Dockerfile to copy `pnpm-lock.yaml`, `server/`, `prisma/`, and `packages/` with production build target. |
| [package.json](file:///c:/Zobra/package.json) | `MODIFIED` | Added explicit `build:server`, `build:web`, `start:server`, `start:web`, `db:generate`, and `db:push` scripts referencing `prisma/schema.prisma`. |

---

## 5. Local Verification Results

All required verification steps executed and passed with code 0:

| Verification Step | Command | Result |
| :--- | :--- | :---: |
| **1. Frozen Lockfile Install** | `pnpm install --frozen-lockfile` | 🟢 **PASS** (Lockfile is up to date, 0 errors) |
| **2. Server Package Build** | `pnpm --filter zobra-server build` | 🟢 **PASS** (`tsc` compilation clean, 0 errors) |
| **3. Web Frontend Build** | `pnpm --filter web build` | 🟢 **PASS** (44/44 static/dynamic Next.js routes generated) |
| **4. Whole Monorepo Build** | `pnpm build` | 🟢 **PASS** (5/5 workspace packages built successfully) |

---

## 6. Railway Deployment Instructions (Summary)

1. Push latest configuration to GitHub.
2. In Railway Dashboard:
   - For **`zobra-server`**: Set Build Command to `pnpm install --frozen-lockfile && npx prisma generate --schema=prisma/schema.prisma && pnpm --filter zobra-server build` and Start Command to `pnpm --filter zobra-server start` (or point Dockerfile to `server/Dockerfile`).
   - For **`web`**: Set Build Command to `pnpm install --frozen-lockfile && pnpm --filter web build` and Start Command to `pnpm --filter web start` (or point Dockerfile to `apps/web/Dockerfile`).
   - For **Database**: Run staging pre-deploy `npx prisma db push --schema=prisma/schema.prisma` with Railway `DATABASE_URL`.
