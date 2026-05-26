## DEV

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# seed / migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec app npx prisma migrate dev
```

## TEST

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit
# retorna exit code 0 (passou) ou 1 (falhou) — ideal para CI/CD
```

## PROD

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# seed em prod (com cuidado)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app npm run seed
```
