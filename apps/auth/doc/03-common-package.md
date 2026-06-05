# 03 — Common Package

## Responsabilidade

Fornecer recursos reutilizáveis para todos os apps do monorepo.

## Escopo

Tudo que é genérico e reaproveitável deve ficar aqui.

## O que implementar aqui

```txt
Either
Errors
Logger
BcryptHasher
HttpClient
CacheService
TransactionManager
DTO helpers
Schema helpers
Container tokens
```

## O que não colocar aqui

- Use cases específicos.
- Controllers.
- Repositories de domínio.
- Regras de tenant.

## Estrutura sugerida

```txt
packages/common/src/
  domain/
    errors/
    values-objects/
  infrastructure/
    logger/
    http/
    cache/
    transaction/
  shared/
    container/
    schemas/
    utils/
```

## Decisão profissional

`common` não deve conhecer `auth-service`, `backend` ou `frontend`. Ele deve ser independente.

## Próximo passo

Depois do common, implemente o auth-service usando os contratos compartilhados.
