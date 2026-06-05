# 07 — Backend SaaS

## Responsabilidade

Executar as regras de negócio do produto.

## Escopo

Este backend responde às regras do sistema, sempre usando autenticação e autorização já resolvidas.

## Módulos possíveis

```txt
Users
Tenants
Organizations
Memberships
Leads
Hotspot
Vouchers
Payments
Subscriptions
Reports
Settings
```

## O que implementar

- Use cases de negócio.
- Controllers protegidos.
- Repositories dos módulos.
- Validações específicas.
- Eventos e auditoria.

## O que não colocar aqui

- Hash de senha.
- Login real.
- Refresh de session.
- OTP.

## Exemplo de fluxo

```txt
Controller protegido
  ↓
authGuard
  ↓
canGuard
  ↓
UseCase de negócio
  ↓
Repository
```

## Regra profissional

Todo use case de negócio deve receber o contexto autenticado:

```txt
userId
tenantId
organizationId
role
permissions
```

## Próximo passo

Depois do backend, integre o frontend Next.js.
