## DEV

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Migrations e seed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec app npx prisma migrate dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed

# Shell direto no banco
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U app_user -d app_db
```

## TEST

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit
# Banco _test isolado em tmpfs — destrói tudo ao encerrar
```

## PROD

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Apenas migrate deploy (nunca migrate dev em prod)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Backup do banco
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  pg_dump -U app_user app_db > backup_$(date +%F).sql
```
