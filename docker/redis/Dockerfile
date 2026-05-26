# ─────────────────────────────────────────────────────────────
# Stage 1 — base: dependências comuns a todos os ambientes
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

RUN apk add --no-cache bash curl

WORKDIR /app

COPY package*.json ./

# ─────────────────────────────────────────────────────────────
# Stage 2 — development: todas as deps + hot-reload
# ─────────────────────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

RUN npm install

COPY . .

RUN npx prisma generate 2>/dev/null || true

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────────────────────
# Stage 3 — test: roda a suite de testes e sai
# ─────────────────────────────────────────────────────────────
FROM base AS test

ENV NODE_ENV=test

RUN npm install

COPY . .

RUN npx prisma generate 2>/dev/null || true

CMD ["npm", "run", "test"]

# ─────────────────────────────────────────────────────────────
# Stage 4 — builder: compila o projeto (TypeScript / build)
# ─────────────────────────────────────────────────────────────
FROM base AS builder

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate 2>/dev/null || true

# Se usar TypeScript, descomente:
# RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 5 — production: imagem final enxuta
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production

RUN apk add --no-cache bash curl

WORKDIR /app

# Copia apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
# Se usar Prisma:
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Usuário sem privilégios de root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "src/index.js"]
