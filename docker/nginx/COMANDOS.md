## DEV

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Reload nginx sem rebuild (após editar dev.conf)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec nginx nginx -s reload

# Validar config
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec nginx nginx -t
```

## TEST

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit
```

## PROD

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Renovação SSL manual (o certbot roda automático a cada 12h)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec certbot certbot renew
```
