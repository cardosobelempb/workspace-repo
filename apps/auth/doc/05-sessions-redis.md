# 05 — Sessions com Redis

## Responsabilidade

Implementar autenticação escalável, revogável e segura usando PostgreSQL + Redis.

## Escopo

Este guia define como a sessão será criada, validada, cacheada e revogada.

## Abordagens comparadas

| Abordagem | Segurança | Complexidade | Recomendação |
|---|---|---:|---|
| Bearer Token | Média | Média | Boa para APIs |
| httpOnly Cookie + Redis | Alta | Média | Melhor para Next.js SaaS |
| JWT + Redis Blacklist | Média | Alta | Usar somente se necessário |

## Recomendação profissional

Para Next.js SaaS, use:

```txt
httpOnly Cookie + Redis
```

Porque o token não fica disponível para JavaScript.

## O que implementar

```txt
SessionRepository
PrismaSessionRepository
RedisSessionService
CreateSessionUseCase
RevokeSessionUseCase
RotateSessionUseCase
authGuard
```

## Fluxo

```txt
Request
  ↓
authGuard
  ↓
Redis get session
  ↓ cache miss
PostgreSQL get session
  ↓
Redis set session
  ↓
request.auth populado
```

## O que não colocar aqui

- RBAC detalhado.
- Tenant rules.
- Controllers de domínio.

## Próximo passo

Depois das sessões, implemente RBAC multi-tenant.
