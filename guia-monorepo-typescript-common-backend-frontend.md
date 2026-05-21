# Guia Passo a Passo — Implementação Profissional de Monorepo TypeScript

> Guia prático para criar e configurar um monorepo profissional com **Backend**, **Frontend**, **Mobile**, **Common**, **TypeScript**, **ESLint**, **Prettier**, **EditorConfig**, **Jest**, **Docker**, **PNPM** e fluxo de build/dev sem `pnpm --filter`.

---

## 1. Objetivo

Este guia documenta a implementação de um projeto monorepo TypeScript com a seguinte estrutura:

```txt
project-model/
├─ apps/
│  ├─ backend/
│  ├─ frontend/
│  └─ mobile/
│
├─ packages/
│  ├─ common/
│  ├─ eslint-config/
│  ├─ jest-config/
│  └─ typescript-config/
│
├─ docker/
├─ docs/
├─ package.json
├─ pnpm-workspace.yaml
├─ .prettierrc
├─ .prettierignore
├─ .editorconfig
├─ .gitignore
└─ README.md
```

---

## 2. Ordem correta de implementação

```txt
1. Criar estrutura base do monorepo
2. Configurar PNPM Workspace
3. Criar packages reutilizáveis de TypeScript, Testes e ESLint
4. Criar pacote common
5. Criar backend
6. Criar frontend
7. Criar mobile
8. Configurar Prettier
9. Configurar EditorConfig
10. Configurar Docker
11. Configurar Gitignore
12. Criar scripts profissionais
13. Validar build, lint, typecheck e testes
```

### Regra de ambiente por app

- Cada app e dono do proprio schema de ambiente e dos arquivos `.env*`.
- O pacote `packages/common` nao deve exportar schema/env concreto de aplicacao.
- Centralize apenas o core reutilizavel em `packages/common/src/shared/env-config` (helpers + schemas base + parser).
- O carregamento de dotenv deve ocorrer apenas no entrypoint do app executavel (backend, database, frontend/mobile quando aplicavel).
- Evite acoplamento cruzado: backend nao deve exigir variaveis exclusivas do database e vice-versa.

---

## 3. Criar estrutura inicial

```bash
mkdir project-model
cd project-model
pnpm init
mkdir apps packages docker docs
mkdir apps/backend apps/frontend apps/mobile
mkdir packages/common packages/typescript-config packages/jest-config packages/eslint-config
```

---

## 4. Configurar PNPM Workspace

Crie `pnpm-workspace.yaml` na raiz:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

> Deve existir apenas **um** `pnpm-workspace.yaml`, sempre na raiz.

---

## 5. Package raiz

`package.json`:

```json
{
  "name": "project-model",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"cd apps/backend && pnpm dev\" \"cd apps/frontend && pnpm dev\"",
    "dev:backend": "cd apps/backend && pnpm dev",
    "dev:frontend": "cd apps/frontend && pnpm dev",
    "dev:mobile": "cd apps/mobile && pnpm dev",

    "build": "pnpm build:common && concurrently \"cd apps/backend && pnpm build\" \"cd apps/frontend && pnpm build\"",
    "build:common": "cd packages/common && pnpm build",
    "start": "concurrently \"cd apps/backend && pnpm start\" \"cd apps/frontend && pnpm start\"",
    "start:backend": "cd apps/backend && pnpm start",
    "start:frontend": "cd apps/frontend && pnpm start",

    "test": "pnpm test:common && pnpm test:backend && pnpm test:frontend && pnpm test:mobile",
    "test:common": "cd packages/common && pnpm test",
    "test:backend": "cd apps/backend && pnpm test",
    "test:frontend": "cd apps/frontend && pnpm test",
    "test:mobile": "cd apps/mobile && pnpm test",

    "typecheck": "pnpm typecheck:common && pnpm typecheck:backend && pnpm typecheck:frontend && pnpm typecheck:mobile",
    "typecheck:common": "cd packages/common && pnpm typecheck",
    "typecheck:backend": "cd apps/backend && pnpm typecheck",
    "typecheck:frontend": "cd apps/frontend && pnpm typecheck",
    "typecheck:mobile": "cd apps/mobile && pnpm typecheck",

    "lint": "pnpm lint:common && pnpm lint:backend && pnpm lint:frontend && pnpm lint:mobile",
    "lint:common": "cd packages/common && pnpm lint",
    "lint:backend": "cd apps/backend && pnpm lint",
    "lint:frontend": "cd apps/frontend && pnpm lint",
    "lint:mobile": "cd apps/mobile && pnpm lint",

    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

Instale as dependências de tooling na raiz:

```bash
pnpm add -Dw concurrently typescript@5.8.2 eslint prettier @eslint/js typescript-eslint eslint-config-prettier jest ts-jest @types/jest jest-environment-jsdom
```

### Pacotes reutilizáveis de TypeScript, Testes e ESLint

Em vez de espalhar configuração por arquivo raiz e duplicar trechos em cada app, centralize a base em packages internos:

- `@repo/typescript-config` exporta presets para `library`, `backend`, `frontend` e `mobile`.
- `@repo/jest-config` exporta factories para `node`, `next` e `expo`.
- `@repo/eslint-config` exporta configurações para `base`, `node`, `next` e `react-native`.
- Cada projeto mantém somente um arquivo fino para ajustar `include`, aliases, setup e regras específicas.

---

## 6. Packages de configuração reutilizáveis

### `packages/typescript-config/package.json`

```json
{
  "name": "@repo/typescript-config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "files": ["base.json", "backend.json", "frontend.json", "library.json", "mobile.json"],
  "peerDependencies": {
    "typescript": "5.8.2"
  }
}
```

### `packages/typescript-config/base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

> Os aliases com `paths` devem ficar no `tsconfig.json` consumidor, porque caminhos relativos dentro do package de configuração deixam de apontar para o monorepo real quando o preset é resolvido via workspace.

### `packages/typescript-config/library.json`

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "noEmit": false
  }
}
```

### `packages/typescript-config/backend.json`

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "types": ["node"],
    "noEmit": true
  }
}
```

### `packages/typescript-config/frontend.json`

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "noEmit": true
  }
}
```

### `packages/typescript-config/mobile.json`

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "types": ["jest"],
    "noEmit": true
  }
}
```

### `packages/jest-config/package.json`

```json
{
  "name": "@repo/jest-config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./node": "./node.ts",
    "./next": "./next.ts",
    "./expo": "./expo.ts"
  },
  "peerDependencies": {
    "jest": "^30.0.0",
    "ts-jest": "^29.4.0",
    "jest-environment-jsdom": "^30.0.0"
  }
}
```

### `packages/jest-config/node.ts`

```ts
import type { Config } from "jest";

type NodeOptions = {
  tsconfig: string;
  roots: string[];
  setupFilesAfterEnv?: string[];
  moduleNameMapper?: Record<string, string>;
};

export function createNodeConfig(options: NodeOptions): Config {
  return {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: options.roots,
    testMatch: ["**/*.spec.ts", "**/*.test.ts"],
    setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],
    moduleNameMapper: options.moduleNameMapper,
    globals: {
      "ts-jest": {
        tsconfig: options.tsconfig,
      },
    },
    clearMocks: true,
  };
}
```

### `packages/jest-config/next.ts`

```ts
import type { Config } from "jest";

export function createNextConfig(): Config {
  return {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    testMatch: ["**/*.spec.tsx", "**/*.test.tsx", "**/*.spec.ts", "**/*.test.ts"],
    clearMocks: true,
  };
}
```

### `packages/jest-config/expo.ts`

```ts
import type { Config } from "jest";

export function createExpoConfig(): Config {
  return {
    preset: "jest-expo",
    testMatch: ["**/*.spec.tsx", "**/*.test.tsx", "**/*.spec.ts", "**/*.test.ts"],
    clearMocks: true,
  };
}
```

### `packages/eslint-config/package.json`

```json
{
  "name": "@repo/eslint-config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.mjs",
    "./node": "./node.mjs",
    "./next": "./next.mjs",
    "./react-native": "./react-native.mjs"
  },
  "peerDependencies": {
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "eslint-config-prettier": "^10.0.0"
  }
}
```

### `packages/eslint-config/base.mjs`

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.expo/**",
      "**/android/**",
      "**/ios/**",
      "**/*.config.cjs",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);
```

### `packages/eslint-config/node.mjs`

```js
import baseConfig from "./base.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      "no-console": "off",
    },
  },
];
```

### `packages/eslint-config/next.mjs`

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import baseConfig from "./base.mjs";

export default defineConfig([
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "next-env.d.ts"]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);
```

### `packages/eslint-config/react-native.mjs`

```js
import baseConfig from "./base.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
```

> Recomendação: use `typescript@5.8.2` para manter os presets previsíveis entre Node, Next, Expo e Jest.

---

## 7. Pacote Common

Estrutura:

```txt
packages/common/
├─ src/
│  └─ index.ts
├─ package.json
└─ tsconfig.json
```

Crie:

```bash
mkdir packages/common/src
type nul > packages/common/src/index.ts
```

### `packages/common/package.json`

```json
{
  "name": "@repo/common",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsup src/index.ts --watch --format esm --dts",
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "jest --config jest.config.ts --passWithNoTests",
    "typecheck": "tsc --project tsconfig.json --noEmit",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/jest-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  }
}
```

### `packages/common/tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

### `packages/common/jest.config.ts`

```ts
import { createNodeConfig } from "@repo/jest-config/node";

export default createNodeConfig({
  tsconfig: "<rootDir>/tsconfig.json",
  roots: ["<rootDir>/src"],
});
```

### `packages/common/eslint.config.mjs`

```js
import baseConfig from "@repo/eslint-config/base";

export default baseConfig;
```

Instale:

```bash
cd packages/common
pnpm add -D tsup jest ts-jest @types/jest eslint typescript @repo/typescript-config @repo/jest-config @repo/eslint-config
cd ../..
```

---

## 8. Adicionar Common e os packages de configuração nos apps

Em cada app, adicione:

```json
{
  "dependencies": {
    "@repo/common": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/jest-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  }
}
```

Depois rode na raiz:

```bash
pnpm install
```

Se aparecer `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`, confira:

```txt
packages/common/package.json
```

O nome precisa ser:

```json
"name": "@repo/common"
```

---

## 9. Backend

Estrutura:

```txt
apps/backend/
├─ src/
│  └─ server.ts
├─ test/
│  └─ setup.ts
├─ package.json
├─ tsconfig.json
├─ tsconfig.test.json
└─ jest.config.ts
```

Instale:

```bash
cd apps/backend
pnpm add fastify zod dotenv @prisma/client @repo/common
pnpm add -D typescript@5.8.2 tsx tsup @types/node prisma jest ts-jest @types/jest supertest @types/supertest ts-node
cd ../..
```

### `apps/backend/src/server.ts`

```ts
import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/", async () => {
  return {
    message: "API running 🚀",
  };
});

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT ?? 3333),
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
```

### `apps/backend/package.json`

```json
{
  "name": "@repo/backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@repo/common": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/jest-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup src/server.ts --format esm --clean",
    "start": "node dist/server.js",
    "test": "jest --config jest.config.ts --passWithNoTests",
    "test:watch": "jest --config jest.config.ts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src test --ext .ts"
  }
}
```

### `apps/backend/tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/backend.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "paths": {
      "@repo/common": ["../../packages/common/src/index.ts"],
      "@repo/common/*": ["../../packages/common/src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

### `apps/backend/tsconfig.test.json`

```json
{
  "extends": "@repo/typescript-config/backend.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "types": ["node", "jest"],
    "paths": {
      "@repo/common": ["../../packages/common/src/index.ts"],
      "@repo/common/*": ["../../packages/common/src/*"]
    }
  },
  "include": ["src", "test", "**/*.spec.ts", "**/*.test.ts"]
}
```

### `apps/backend/jest.config.ts`

```ts
import { createNodeConfig } from "@repo/jest-config/node";

export default createNodeConfig({
  tsconfig: "<rootDir>/tsconfig.test.json",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@repo/common$": "<rootDir>/../../packages/common/src/index.ts",
    "^@repo/common/(.*)$": "<rootDir>/../../packages/common/src/$1",
  },
});
```

### `apps/backend/test/setup.ts`

```ts
beforeEach(() => {
  jest.clearAllMocks();
});
```

### `apps/backend/eslint.config.mjs`

```js
import nodeConfig from "@repo/eslint-config/node";

export default nodeConfig;
```

### `apps/frontend/package.json`

```json
{
  "name": "@repo/frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@repo/common": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/jest-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  },
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "jest --config jest.config.ts --passWithNoTests",
    "typecheck": "tsc --noEmit"
  }
}
```

### `apps/frontend/tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/frontend.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@repo/common": ["../../packages/common/src/index.ts"],
      "@repo/common/*": ["../../packages/common/src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "app", "src", "components", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### `apps/frontend/eslint.config.mjs`

```js
import nextConfig from "@repo/eslint-config/next";

export default nextConfig;
```

### `apps/frontend/jest.config.ts`

```ts
import { createNextConfig } from "@repo/jest-config/next";

export default createNextConfig();
```

### `apps/frontend/next.config.ts`

```ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
};

export default nextConfig;
```

---

## 11. Mobile Expo

Criar:

```bash
cd apps
pnpm create expo-app mobile --template blank-typescript
cd ..
```

### `apps/mobile/package.json`

```json
{
  "name": "@repo/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo/AppEntry.js",
  "dependencies": {
    "@repo/common": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/jest-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  },
  "scripts": {
    "dev": "expo start",
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest --config jest.config.ts --passWithNoTests",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

### `apps/mobile/tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/mobile.json",
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "react-native",
    "types": ["jest"],
    "paths": {
      "@repo/common": ["../../packages/common/src/index.ts"],
      "@repo/common/*": ["../../packages/common/src/*"]
    }
  },
  "include": ["App.tsx", "src", "**/*.ts", "**/*.tsx"]
}
```

### `apps/mobile/eslint.config.mjs`

```js
import reactNativeConfig from "@repo/eslint-config/react-native";

export default reactNativeConfig;
```

### `apps/mobile/jest.config.ts`

```ts
import { createExpoConfig } from "@repo/jest-config/expo";

export default createExpoConfig();
```

### `apps/mobile/App.tsx`

```tsx
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>Mobile rodando com Expo 🚀</Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

---

## 12. Padrão de uso dos packages de lint e teste

Cada projeto fica com um arquivo local mínimo para conectar o package compartilhado ao contexto do app:

- `tsconfig.json` ajusta apenas `include`, `exclude`, `outDir` e `rootDir`.
- `jest.config.ts` injeta `roots`, `setupFilesAfterEnv` e `moduleNameMapper` locais.
- `eslint.config.mjs` importa o preset compartilhado e recebe só overrides específicos do app.

Essa abordagem evita divergência entre backend, frontend, mobile e bibliotecas internas.

---

## 13. Prettier

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 90,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### `.prettierignore`

```txt
node_modules
dist
.next
coverage
.expo
android
ios
generated
pnpm-lock.yaml
```

---

## 14. EditorConfig

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

---

## 15. Gitignore

`.gitignore`:

```gitignore
node_modules
.pnpm-store

*.log
logs
npm-debug.log*
pnpm-debug.log*

dist
build
coverage
tmp
temp

.next
out

.expo
.expo-shared
android
ios

.env
.env.*
!.env.example

*.sqlite
*.db
prisma/dev.db

generated
generated/prisma

.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea

.DS_Store
Thumbs.db

.cache
.parcel-cache
.turbo

*.tsbuildinfo

docker-data
postgres-data
redis-data

uploads
storage
backup
backups
```

---

## 16. Dockerização

### `apps/backend/Dockerfile.dev`

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/common/package.json ./packages/common/package.json

RUN pnpm install

COPY . .

EXPOSE 3333

CMD ["sh", "-c", "cd apps/backend && pnpm dev"]
```

### `apps/frontend/Dockerfile.dev`

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install

EXPOSE 3000

CMD ["sh", "-c", "cd apps/frontend && pnpm dev"]
```

### `docker-compose.dev.yml`

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.dev
    container_name: backend-dev
    ports:
      - "3333:3333"
    env_file:
      - .env.development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile.dev
    container_name: frontend-dev
    ports:
      - "3000:3000"
    env_file:
      - .env.development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - backend

  postgres:
    image: postgres:16-alpine
    container_name: postgres-dev
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app_dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

---

## 17. Variáveis de ambiente

### `.env.development`

```env
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://dev:dev@postgres:5432/app_dev
NEXT_PUBLIC_API_URL=http://localhost:3333
JWT_SECRET=development_secret
```

### `.env.test`

```env
NODE_ENV=test
PORT=3333
DATABASE_URL=postgresql://test:test@postgres-test:5432/app_test
JWT_SECRET=test_secret
```

### `.env.production`

```env
NODE_ENV=production
PORT=3333
DATABASE_URL=postgresql://user:password@postgres:5432/app_prod
NEXT_PUBLIC_API_URL=https://api.seusistema.com
JWT_SECRET=change_this_secret
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=app_prod
```

---

## 18. Comandos principais

```bash
pnpm list -r
pnpm install
pnpm dev
pnpm dev:backend
pnpm dev:frontend
pnpm dev:mobile
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm format
pnpm test
docker compose -f docker-compose.dev.yml up --build
```

---

## 19. Erros comuns e correções

### `Cannot find src/server.ts`

Crie:

```txt
apps/backend/src/server.ts
```

Ou ajuste os scripts para o arquivo real.

### `No projects matched the filters`

Evite `pnpm --filter`. Use:

```bash
cd apps/backend
pnpm add fastify
```

Ou:

```bash
cd apps/backend
pnpm add fastify
cd ../..
```

O mesmo vale para os packages de configuração:

```bash
cd packages/typescript-config && pnpm add -D typescript && cd ../..
cd packages/jest-config && pnpm add -D jest ts-jest @types/jest && cd ../..
cd packages/eslint-config && pnpm add -D eslint @eslint/js typescript-eslint eslint-config-prettier && cd ../..
```

### `@repo/common@workspace:* not found`

Confira:

```txt
packages/common/package.json
```

Deve conter:

```json
"name": "@repo/common"
```

### Next detectou múltiplos workspaces

Remova:

```txt
apps/frontend/pnpm-workspace.yaml
```

### Expo não encontra `../../App`

Crie:

```txt
apps/mobile/App.tsx
```

### ESLint analisando `.next`

Adicione ignore:

```txt
.next/**
```

### `module is not defined`

Use `jest.config.ts` com:

```ts
export default config;
```

### `No tests found`

Use:

```json
"test": "jest --passWithNoTests"
```

---

## 20. Fluxo profissional recomendado para módulos

```txt
1. Schema
2. DTO
3. Entity
4. Factory
5. Mapper
6. Repository abstrato
7. Use Case
8. Teste unitário
9. Prisma Mapper
10. Prisma Repository
11. Controller
12. Teste E2E
```

Esse fluxo combina com Clean Architecture, TDD, DTOs inferidos por schema e separação entre domínio, aplicação e infraestrutura.

---

## 21. Checklist final

```txt
[ ] pnpm install funcionando
[ ] pnpm dev funcionando
[ ] pnpm build funcionando
[ ] pnpm typecheck funcionando
[ ] pnpm lint funcionando
[ ] pnpm test funcionando
[ ] backend em localhost:3333
[ ] frontend em localhost:3000
[ ] mobile Expo abrindo
[ ] common reconhecido nos apps
[ ] .gitignore configurado
[ ] Docker funcionando
```

---

## 22. Regra principal de dependências

```txt
common   → não depende de ninguém
auth     → pode depender de common
database → pode depender de common
backend  → common + auth + database
frontend → common + auth
mobile   → common + auth
```

---

## 23. Conclusão

A ordem mais segura para implementar novos projetos é:

```txt
Configuração → Common → Backend → Frontend → Mobile → Testes → Docker → Deploy
```

Este guia pode ser reutilizado como base inicial para novos projetos TypeScript profissionais.
