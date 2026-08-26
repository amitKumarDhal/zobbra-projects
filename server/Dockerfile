# Production Dockerfile for ZOBBRA Backend (zobra-server)
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm turbo

WORKDIR /app

# 1. Copy Monorepo root configuration & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# 2. Copy shared packages, prisma schema, server, and web application
COPY packages/ ./packages/
COPY prisma/ ./prisma/
COPY server/ ./server/
COPY apps/web/ ./apps/web/

# 3. Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# 4. Generate Prisma client from canonical schema & build server
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zobra_db?schema=public"
RUN pnpm run db:generate
RUN pnpm --filter zobra-server build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# 5. Start production server
CMD ["pnpm", "--filter", "zobra-server", "start"]
