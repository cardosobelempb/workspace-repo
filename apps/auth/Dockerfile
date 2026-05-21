FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/auth/package.json ./apps/auth/package.json
COPY apps/database/package.json ./apps/database/package.json
COPY packages/common/package.json ./packages/common/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/jest-config/package.json ./packages/jest-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN pnpm install --filter @repo/auth... --filter @repo/database... --filter @repo/common... --filter @repo/eslint-config... --filter @repo/jest-config... --filter @repo/typescript-config...

COPY . .

EXPOSE 3333

CMD ["sh", "-c", "cd apps/auth && pnpm dev"]
