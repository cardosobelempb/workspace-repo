# 02 — Database e Prisma

## Responsabilidade

Centralizar a modelagem do banco, Prisma schema, migrations e client compartilhado.

## Escopo

Este guia cuida da persistência base do SaaS.

## Modelos principais

```txt
User
UserProfile
Session
Token
Otp
Tenant
Organization
Membership
```

## O que implementar aqui

- `schema.prisma` organizado por domínio.
- Migrations.
- Índices.
- Relações.
- Prisma Client.
- Tipos de transação.

## O que não colocar aqui

- Regra de negócio.
- Lógica de login.
- Validação HTTP.
- RBAC em controller.

## Decisão profissional

O banco deve estar preparado para:

```txt
User separado de UserProfile
Session revogável
Redis como cache de session
Tenant + Organization + Membership
Refresh/Reset tokens salvos como hash
```

## Erros comuns

- Salvar token puro no banco.
- Misturar dados de login com perfil completo.
- Não indexar `userId`, `tenantId`, `organizationId` e `sessionToken`.
- Colocar permissões fixas no usuário.

## Próximo passo

Depois do Prisma, implemente o `packages/common` com erros, Either, logger, cache e transaction manager.
