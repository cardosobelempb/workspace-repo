# 06 — RBAC Multi-Tenant

## Responsabilidade

Controlar o que cada usuário pode fazer dentro de um tenant e organization.

## Escopo

Este guia responde à pergunta:

```txt
O que este usuário pode fazer neste tenant?
```

## Modelos principais

```txt
Tenant
Organization
Membership
Role
Permission
```

## O que implementar

```txt
roles.ts
permissions.ts
role-permissions.ts
MembershipRepository
PrismaMembershipRepository
canGuard
tenantResolver
```

## Fluxo

```txt
authGuard valida sessão
  ↓
canGuard lê tenantId
  ↓
MembershipRepository.findActive()
  ↓
carrega role
  ↓
valida permission
  ↓
controller executa
```

## Use cases principais

```txt
CreateTenantUseCase
CreateOrganizationUseCase
InviteMemberUseCase
AcceptInviteUseCase
RemoveMemberUseCase
UpdateMemberRoleUseCase
```

## O que não colocar aqui

- Login.
- Criação de senha.
- Redis session.
- Regras de frontend.

## Erros comuns

- Validar apenas role sem tenant.
- Colocar permissions dentro do token.
- Confiar no tenant enviado pelo frontend sem validar membership.

## Próximo passo

Depois do RBAC, implemente os módulos reais do backend SaaS.
