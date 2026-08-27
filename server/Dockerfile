# Production Dockerfile for ZOBBRA Backend (zobra-server)
FROM node:20-alpine AS base
RUN apk add --no-cache openssl1.1-compat libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
RUN npm install -g turbo

WORKDIR /app

# 1. Copy Monorepo root configuration & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# 2. Copy shared packages, prisma schema, and server
COPY packages/ ./packages/
COPY prisma/ ./prisma/
COPY server/ ./server/

# 3. Install dependencies using frozen lockfile for zobra-server only
RUN pnpm install --filter zobra-server... --frozen-lockfile

# 4. Compile workspace packages
RUN pnpm run db:generate
RUN pnpm --filter zobra-server build

ENV NODE_ENV=production

# 5. Start production server
CMD ["pnpm", "--filter", "zobra-server", "start"]
