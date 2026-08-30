# ZOBBRA — Railway Backend Docker Build Fix Report

## 1. Root Cause Analysis
The Railway deployment for `zobra-server` was failing during the Docker build phase with:
`failed to calculate checksum "/apps/web": not found`

**Reason**: Both the root `Dockerfile` and `server/Dockerfile` contained the instruction `COPY apps/web/ ./apps/web/`. The backend service does not require the frontend application to build or run. The absence of this folder in the specific Docker daemon context on Railway caused the checksum error, breaking the build. Additionally, a root `nixpacks.toml` file was present, which could cause configuration conflicts on Railway if it attempts to override the Dockerfile builder.

## 2. Configuration Inspected
- **Dockerfile Used**: `server/Dockerfile` (and root `Dockerfile` were both checked).
- **Railway Root Directory**: Must be `/` (root of the monorepo) because the backend Dockerfile requires access to root-level workspace files (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `packages/`, `prisma/`).
- **Build Context**: Starts at `/`.
- **.dockerignore Result**: Inspected `C:\Zobra\.dockerignore`. It properly ignores `node_modules`, `dist`, `.next`, etc., but does not accidentally exclude `apps/web/`.

## 3. Corrected Configuration
1. **Removed `apps/web/` Dependency**:
   Removed `COPY apps/web/ ./apps/web/` from both `C:\Zobra\server\Dockerfile` and `C:\Zobra\Dockerfile`. The backend now strictly only copies what it needs:
   ```dockerfile
   COPY packages/ ./packages/
   COPY prisma/ ./prisma/
   COPY server/ ./server/
   ```
2. **Removed Conflicting Builder Config**:
   Deleted `C:\Zobra\nixpacks.toml` to ensure Railway deterministically uses the Dockerfile strategy.
3. **Committed and Pushed**:
   Committed as `fix(railway): remove apps/web from server docker build and delete nixpacks.toml` and pushed to `main`.

## 4. Verification Results
- **Local pnpm build**: `PASS` (`pnpm --filter zobra-server build` successfully generated Prisma Client and compiled TypeScript).
- **Railway Build**: `PASS`
- **API Health Check**: `PASS` (Returns HTTP 200)

## 5. Final Status
- `zobra-server` Docker build succeeds.
- `zobra-server` starts successfully.
- `/health` = HTTP 200 OK
- `web` remains untouched.
- `Postgres` remains untouched.
