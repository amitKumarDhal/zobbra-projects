# Zobra - B2B Merchandise SaaS Setup Guide

This step-by-step guide helps developers run the complete Zobra system locally.

---

## 1. Prerequisites

- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher
- **PostgreSQL**: v14+ running on `localhost:5432` (or Docker PostgreSQL container)

---

## 2. Environment Setup

Copy `.env.example` in `/server` or set environment variables:

```bash
# PostgreSQL Database Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zobra_db?schema=public"

# Server Port & JWT Configuration
PORT=5000
JWT_SECRET="zobra_b2b_secret_key_2026_super_secure"
JWT_EXPIRES_IN="7d"

# Third Party Integrations
RESEND_API_KEY="re_mock_key"
CLOUDINARY_CLOUD_NAME="demo_zobra"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="secret"
```

---

## 3. Database Initialization & Seeding

Run the following commands from root:

```bash
# Generate Prisma Client
npx prisma generate

# Push Database Schema to PostgreSQL
npx prisma db push

# Seed Database with realistic Indian Merchandise Data
npx tsx prisma/seed.ts
```

---

## 4. Running Local Servers

Run both Express API (Port 5000) and Next.js Web App (Port 3000) concurrently:

```bash
npm run dev
```

Or run individually:

```bash
# Express Server (Terminal 1)
npm run dev:server

# Next.js Web App (Terminal 2)
npm run dev:web
```

---

## 5. Demo Login Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@zobbra.com` | `password123` | Full Admin Suite (`/admin`) |
| **Sales** | `sales@zobra.com` | `password123` | Quotes & Customers (`/admin`) |
| **Production** | `production@zobra.com` | `password123` | Production Kanban (`/admin/production`) |
| **Customer** | `client@acme.com` | `password123` | Customer Portal (`/portal`) |

---

## 6. Running Tests

```bash
# Backend API Unit Tests
npm run test:server

# Cypress E2E Tests
npm run test:cypress
```
