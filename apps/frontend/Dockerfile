# ═══════════════════════════════════════════════════════════════
#  apps/frontend/Dockerfile — Next.js
#  context: raiz do monorepo (context: .)
#
#  Stages:
#    base        → node + pnpm
#    deps        → instala dependências
#    development → hot-reload (next dev)
#    test        → roda vitest
#    builder     → next build
#    production  → standalone mínimo
# ═══════════════════════════════════════════════════════════════

# ── base ──────────────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache bash curl libc6-compat
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /repo

# ── deps ──────────────────────────────────────────────────────
FROM base AS deps

# Copia manifests da raiz e dos packages que o frontend consome
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/backend/package.json       ./apps/backend/
COPY apps/frontend/package.json      ./apps/frontend/
COPY apps/mobile/package.json        ./apps/mobile/
COPY packages/cache/package.json     ./packages/cache/
COPY packages/common/package.json    ./packages/common/
COPY packages/database/package.json  ./packages/database/
COPY packages/env-config/package.json ./packages/env-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/logger/package.json    ./packages/logger/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# ── development ───────────────────────────────────────────────
FROM deps AS development

ENV NODE_ENV=development

# Copia todo o código (bind-mount sobrescreve em dev)
COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "@repo/frontend", "dev"]

# ── test ──────────────────────────────────────────────────────
FROM deps AS test

ENV NODE_ENV=test

COPY . .

CMD ["pnpm", "--filter", "@repo/frontend", "test"]

# ── builder ───────────────────────────────────────────────────
FROM deps AS builder

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_NAME="SURB Servicos Urbanos"
ARG NEXT_PUBLIC_APP_URL="https://surb.com.br"
ARG NEXT_PUBLIC_API_URL="https://surb.com.br/api"
ARG NEXT_PUBLIC_AUTH_URL="https://surb.com.br/auth"
ARG BASE_URL="https://surb.com.br"
ARG SHORT_NAME="SURB"
ARG CONTACT_EMAIL="contato@surb.com.br"
ARG WHATSAPPs="5583999999999"
ARG CORS_ORIGINS="https://surb.com.br"

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV BASE_URL=$BASE_URL
ENV SHORT_NAME=$SHORT_NAME
ENV CONTACT_EMAIL=$CONTACT_EMAIL
ENV WHATSAPPs=$WHATSAPPs

COPY . .

# Compila apenas o frontend
RUN CORS_ORIGINS=$CORS_ORIGINS \
    DATABASE_URL="postgresql://build_user:build_password@postgres:5432/build_db" \
    JWT_ACCESS_TOKEN_SECRET="build_access_jwt_secret" \
    JWT_REFRESH_SECRET="build_refresh_jwt_secret" \
    ACCESS_TOKEN_SECRET="build_access_token_secret" \
    REFRESH_TOKEN_SECRET="build_refresh_token_secret" \
    COOKIE_SECRET="build_cookie_secret" \
    pnpm --filter @repo/frontend build

# ── production ────────────────────────────────────────────────
FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl

# Usuário sem root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Next.js standalone — contém apenas o necessário para rodar
COPY --from=builder --chown=appuser:appgroup \
  /repo/apps/frontend/.next/standalone ./

COPY --from=builder --chown=appuser:appgroup \
  /repo/apps/frontend/.next/static \
  ./apps/frontend/.next/static

COPY --from=builder --chown=appuser:appgroup \
  /repo/apps/frontend/public \
  ./apps/frontend/public

USER appuser

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
