# 09 — Observabilidade

## Responsabilidade

Permitir rastrear, auditar e diagnosticar o sistema em produção.

## Escopo

Logs, métricas, tracing, health checks e auditoria.

## O que implementar

```txt
Logger
RequestId
AuditLog
PrismaLoggerAdapter
Redis metrics
Health checks
Error handler
```

## Eventos importantes

```txt
login_success
login_failed
session_created
session_revoked
password_changed
membership_updated
payment_created
```

## O que não colocar aqui

- Regra de negócio.
- Query de repository.
- Validação de schema.

## Próximo passo

Depois da observabilidade, implemente testes.
