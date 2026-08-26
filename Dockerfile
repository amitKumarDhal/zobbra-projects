# Production Monorepo Dockerfile for ZOBBRA
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm turbo

WORKDIR /app

# Copy Monorepo root configuration & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all packages, prisma, server, and apps
COPY packages/ ./packages/
COPY prisma/ ./prisma/
COPY server/ ./server/
COPY apps/web/ ./apps/web/

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Generate Prisma client from canonical schema
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zobra_db?schema=public"
RUN pnpm run db:generate

# Build all workspace packages
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000 5000

# Default entrypoint starts backend server; Railway services should use service-specific commands or Dockerfiles
CMD ["pnpm", "--filter", "zobra-server", "start"]
