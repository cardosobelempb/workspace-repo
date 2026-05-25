FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/database/package.json ./apps/database/package.json
COPY packages/common/package.json ./packages/common/package.json

RUN pnpm install --filter @repo/database... --filter @repo/common...

COPY . .

RUN pnpm --filter @repo/database build

WORKDIR /app/apps/database

CMD ["node", "dist/index.js"]
