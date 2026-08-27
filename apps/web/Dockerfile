# Production Dockerfile for ZOBBRA Frontend (web)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
RUN npm install -g turbo

WORKDIR /app

# 1. Copy Monorepo root configuration & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# 2. Copy shared packages, prisma schema, server, and Next.js frontend application
COPY packages/ ./packages/
COPY prisma/ ./prisma/
COPY server/ ./server/
COPY apps/web/ ./apps/web/

# 3. Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# 4. Compile Next.js production bundle
RUN pnpm --filter web build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 5. Start production Next.js application
CMD ["pnpm", "--filter", "web", "start"]
