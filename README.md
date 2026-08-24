# Zobra - Modern B2B Merchandise Management SaaS Monorepo

Zobra is initialized as a clean, web-first Turborepo monorepo architecture (`apps/web`, `packages/api`, `packages/database`, `packages/shared`).

---

## 🏗️ Folder Structure

```text
c:\Zobra\
├── apps/
│   └── web/                     # Next.js 14 App Router (Tailwind, shadcn/ui, TanStack Query)
├── packages/
│   ├── api/                     # Express REST API Server (Helmet, CORS, Morgan, Swagger OpenAPI)
│   ├── database/                # Prisma ORM Schema (User & Role models) & Seeder
│   └── shared/                  # Shared TypeScript types & helper constants
├── .editorconfig                # Universal EditorConfig standards
├── .eslintrc.json               # ESLint code quality rules
├── .prettierrc                  # Prettier formatting config
├── commitlint.config.js         # Git commit message linting
├── Dockerfile                   # Production container setup
├── docker-compose.yml           # PostgreSQL Docker service
├── pnpm-workspace.yaml          # Workspace packages definition
├── turbo.json                   # Turborepo task pipeline caching
└── README.md                    # Project documentation
```

---

## ⚡ Run Commands

### 1. Installation Guide
```bash
pnpm install
```

### 2. Database Connection & Prisma Setup
Ensure PostgreSQL is running locally on port `5432` or via Docker (`docker-compose up -d`):
```bash
# Generate Prisma Client
pnpm prisma generate

# Run Prisma Database Migration
pnpm prisma migrate dev

# Seed Admin User & Role
pnpm db:seed
```

### 3. Start Development Mode
```bash
pnpm dev
```

---

## 🌐 URLs & Access Points

- **Next.js Web App**: `http://localhost:3000`
- **Dashboard Home**: `http://localhost:3000/dashboard`
- **Express API Root**: `http://localhost:5000/` (`{"name":"Zobra API","status":"running"}`)
- **Express API Health**: `http://localhost:5000/api/health` (`{"status":"healthy"}`)
- **Swagger Documentation**: `http://localhost:5000/docs`

---

## 🧪 Testing Suite

| Runner | Package | Command |
| :--- | :--- | :--- |
| **Vitest** | `@zobra/database` & `web` | `pnpm test:vitest` |
| **Jest + Supertest** | `@zobra/api` Express API | `pnpm test:jest` |
| **Cypress E2E** | `web` Dashboard | `pnpm test:cypress` |
