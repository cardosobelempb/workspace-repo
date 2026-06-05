# 11 — Docker e Deploy

## Responsabilidade

Preparar o sistema para rodar localmente e em produção.

## Escopo

Dockerfile, Docker Compose, PostgreSQL, Redis, Traefik, Portainer e variáveis de ambiente.

## Serviços principais

```txt
postgres
redis
auth-service
backend
frontend
```

## Regras importantes

```txt
PostgreSQL roda em imagem postgres
Apps Node rodam em imagem node
Redis roda em imagem redis
```

## O que implementar

```txt
Dockerfile por app
docker-compose.yml
.env.example
healthcheck
network interna
volumes persistentes
```

## O que evitar

- Rodar pnpm dentro de imagem postgres.
- Build com contexto errado.
- Expor Redis publicamente.
- Versionar secrets reais.

## Ordem de subida

```txt
postgres
redis
database migrations
auth-service
backend
frontend
```
