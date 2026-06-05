# @repo/database

Camada de banco de dados usando Prisma + PostgreSQL.

## Configuracao rapida

1. Copie `.env.example` para `.env` dentro de `apps/database`.
2. Garanta um Postgres rodando (ex: `docker compose -f docker-compose.dev.yml up --build`).
3. Gere o client: `cd apps/database && pnpm prisma:generate`.
4. Rode migracao local: `cd apps/database && pnpm prisma:migrate:dev`.

## Scripts

- `cd apps/database && pnpm prisma:generate`
- `cd apps/database && pnpm prisma:migrate:dev`
- `cd apps/database && pnpm prisma:migrate:deploy`
- `cd apps/database && pnpm prisma:db:push`
- `cd apps/database && pnpm prisma:studio`
