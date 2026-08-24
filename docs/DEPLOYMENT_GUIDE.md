# Zobra - Production Deployment Guide

This guide details deploying ZOBBRA B2B SaaS to production using Vercel (Next.js Frontend) and Render/Railway/AWS (Node.js API + PostgreSQL).

---

## 1. Database Deployment (PostgreSQL)

Use a managed PostgreSQL instance (Supabase, Neon, AWS RDS, or Render PostgreSQL):
1. Create PostgreSQL database `zobra_prod`.
2. Set `DATABASE_URL` in production env.
3. Run migrations during deployment:
   ```bash
   npx prisma migrate deploy
   ```

---

## 2. Express API Deployment (Render / AWS App Runner / Railway)

1. Root Directory: `server/`
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Required Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `postgresql://...`
   - `JWT_SECRET`: High entropy secret key
   - `RESEND_API_KEY`: Production Resend key
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## 3. Next.js Frontend Deployment (Vercel)

1. Root Directory: `web/`
2. Framework Preset: Next.js
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://api.zobra.com/api/v1`

---

## 4. Post-Deployment Verification Checklist

- [ ] HTTPS enabled on both Web and API domains.
- [ ] CORS policies restricting API access to `https://zobra.com`.
- [ ] Database backup schedule configured (Daily automated snapshots).
- [ ] PDF generation verified on production container (`font` rendering check).
