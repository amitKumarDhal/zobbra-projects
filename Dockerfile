# Production Dockerfile for ZOBBRA Backend (zobra-server)
FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

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

# 4. Generate Prisma client & build server
RUN pnpm run db:generate
RUN pnpm --filter zobra-server build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# 5. Start production server
CMD ["pnpm", "--filter", "zobra-server", "start"]
