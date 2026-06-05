# 10 — Testing e TDD

## Responsabilidade

Garantir qualidade, segurança e evolução sem regressões.

## Escopo

Testes unitários, integração, repository, controller e e2e.

## O que testar primeiro

```txt
RegisterUseCase
LoginUseCase
CreateSessionUseCase
RevokeSessionUseCase
canGuard
MembershipRepository
```

## Tipos de teste

```txt
Unit tests      → use cases e services
Integration    → repositories e Prisma
Controller     → HTTP
E2E            → fluxo completo
```

## Erros comuns

- Testar implementação em vez de comportamento.
- Testar controller gigante.
- Não mockar provider externo.
- Não testar rollback de transação.

## Próximo passo

Depois dos testes, prepare Docker e deploy.
