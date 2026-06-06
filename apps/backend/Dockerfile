# apps/backend/Dockerfile
# context: raiz do monorepo

FROM node:22-alpine AS base

RUN apk add --no-cache bash curl libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /repo


FROM base AS deps

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/mobile/package.json ./apps/mobile/

COPY packages/cache/package.json ./packages/cache/
COPY packages/common/package.json ./packages/common/
COPY packages/database/package.json ./packages/database/
COPY packages/env-config/package.json ./packages/env-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile


FROM deps AS development

ENV NODE_ENV=development

COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "@repo/backend", "dev"]


FROM deps AS test

ENV NODE_ENV=test

COPY . .

CMD ["pnpm", "--filter", "@repo/backend", "test"]


FROM deps AS builder

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY . .

RUN pnpm --filter @repo/common build
RUN pnpm --filter @repo/env-config build
RUN pnpm --filter @repo/logger build
RUN pnpm --filter @repo/database prisma:generate
RUN pnpm --filter @repo/database build
RUN pnpm --filter @repo/cache build
RUN pnpm --filter @repo/backend build

RUN pnpm --filter @repo/backend deploy --prod /prod/backend


FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apk add --no-cache libc6-compat openssl \
  && corepack enable \
  && corepack prepare pnpm@11.1.2 --activate \
  && addgroup -S appgroup \
  && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /prod/backend ./

USER appuser

EXPOSE 3000

CMD ["pnpm", "start"]
