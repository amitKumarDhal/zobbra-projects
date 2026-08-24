# Production Dockerfile for Zobra Monorepo
FROM node:20-alpine AS base
RUN npm install -g pnpm turbo

WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm build

EXPOSE 3000 5000
CMD ["pnpm", "dev"]
