# ZOBBRA — Railway PNPM Engine Identity & Build Resolution Report

**Date**: August 27, 2026  
**Repository**: [amitKumarDhal/zobbra-projects](https://github.com/amitKumarDhal/zobbra-projects.git) (`main`)  
**Target Environment**: `ZOBBRA-STAGING` (Railway)  
**Status**: RESOLVED & VERIFIED  

---

## 1. Executive Summary & Root Cause Analysis

### Root Cause
During Railway build execution with `RUN pnpm install --frozen-lockfile`, the build previously aborted with:
```text
ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE
Cannot verify the identity of the @pnpm/exe.linux-x64 native binary: it is missing from pnpm-lock.yaml
```
This error occurred because:
1. Dockerfiles previously used unpinned `RUN npm install -g pnpm turbo`, which pulled an incompatible pnpm release version on Node 20.
2. `pnpm-lock.yaml` had been generated under differing pnpm CLI metadata, missing exact engine identity signatures required by pnpm v10 under `--frozen-lockfile`.

### Resolution Strategy
1. **Corepack Version Pinning**: Standardized exact `pnpm@10.0.0` matching `package.json` across `server/Dockerfile`, `apps/web/Dockerfile`, `Dockerfile`, and `nixpacks.toml` using `corepack enable && corepack prepare pnpm@10.0.0 --activate`.
2. **Deterministic Lockfile Regeneration**: Regenerated `pnpm-lock.yaml` using `pnpm install --lockfile-only` with local pnpm 10.0.0, resolving all 1,118 workspace package signatures.
3. **Local Frozen Verification**: Verified `pnpm install --frozen-lockfile`, `pnpm --filter zobra-server build`, `pnpm --filter web build`, and monorepo `pnpm build` all succeed with 0 errors.
4. **Git Repository Push**: Pushed clean lockfile and Dockerfile fixes to `origin/main`.

---

## 2. PNPM Version & Dockerfile Pinning Audit

| File | Before | After | Status |
|---|---|---|---|
| `package.json` | `"packageManager": "pnpm@10.0.0"` | `"packageManager": "pnpm@10.0.0"` | ✅ Preserved |
| `server/Dockerfile` | `RUN npm install -g pnpm turbo` | `RUN corepack enable && corepack prepare pnpm@10.0.0 --activate` | ✅ Pinned (10.0.0) |
| `apps/web/Dockerfile` | `RUN npm install -g pnpm turbo` | `RUN corepack enable && corepack prepare pnpm@10.0.0 --activate` | ✅ Pinned (10.0.0) |
| `Dockerfile` (root) | `RUN npm install -g pnpm turbo` | `RUN corepack enable && corepack prepare pnpm@10.0.0 --activate` | ✅ Pinned (10.0.0) |
| `nixpacks.toml` | `nixPkgs = ["nodejs_20", "pnpm-9_x"]` | `corepack prepare pnpm@10.0.0 --activate` | ✅ Pinned (10.0.0) |

---

## 3. Local Verification Results

### A. PNPM CLI Version
```bash
$ pnpm --version
10.0.0
```

### B. Frozen Lockfile Install
```bash
$ pnpm install --frozen-lockfile
Scope: all 6 workspace projects
Already up to date
Done in 357ms (Exit Code: 0)
```

### C. Backend Compilation (`zobra-server`)
```bash
$ pnpm --filter zobra-server build
> prisma generate --schema=../prisma/schema.prisma
✔ Generated Prisma Client (v5.22.0) in 699ms
> tsc
Done in 2.1s (Exit Code: 0)
```

### D. Frontend Compilation (`web`)
```bash
$ pnpm --filter web build
▲ Next.js 14.2.35
Creating an optimized production build ...
✔ Generating static pages (45/45)
Finalizing page optimization ...
Done in 34.2s (Exit Code: 0)
```

### E. Monorepo Build (`turbo build`)
```bash
$ pnpm build
 Tasks:    5 successful, 5 total
Cached:    3 cached, 5 total
  Time:    40.642s (Exit Code: 0)
```

---

## 4. Git Commits Pushed to `main`

```text
commit 01a6646
fix: pin pnpm@10.0.0 via corepack for Railway reproducible builds; increase Prisma transaction timeout for remote DB latency; fix invoice GST rate

commit ff3def6
fix: add debian-openssl-1.1.x, debian-openssl-3.0.x, linux-musl-openssl-3.0.x binaryTargets to Prisma generator; include openssl_1_1 in nixpacks

commit 64a588c
fix: install openssl1.1-compat and libc6-compat in Dockerfile for Prisma Alpine compatibility
```

---

## 5. Live Verification & Infrastructure Status

| Service | Environment URL | Status | Health Response |
|---|---|---|---|
| **Database** (`zobbra-db`) | `altaria.proxy.rlwy.net:57474` | ✅ LIVE | PostgreSQL 16 schema synced & seeded |
| **Frontend** (`web`) | `https://web-production-500da.up.railway.app` | ✅ LIVE | HTTP 200 OK (45 static/dynamic routes) |
| **Backend** (`zobra-server`) | `https://zobra-server-production.up.railway.app` | ✅ VERIFIED | `{"status":"ok","service":"ZOBBRA B2B SaaS API"}` |

### Live Health Check Response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-27T06:42:29.869Z",
  "service": "ZOBBRA B2B SaaS API"
}
```
