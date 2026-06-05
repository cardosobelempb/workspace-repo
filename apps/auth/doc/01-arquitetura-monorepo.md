# 01 — Arquitetura do Monorepo

## Responsabilidade

Definir a visão geral do projeto, separando aplicações, pacotes, responsabilidades e comunicação entre serviços.

## Escopo

Este guia explica onde cada parte do sistema deve viver.

```txt
apps/
  auth-service/
  backend/
  frontend/

packages/
  common/
  database/
  contracts/
```

## O que implementar aqui

- Estrutura de pastas do monorepo.
- Responsabilidades de cada app.
- Comunicação entre backend e auth-service.
- Padrão de arquitetura limpa.
- Convenções de nomes.

## O que não colocar aqui

- Código de use case.
- Código de repository.
- Docker detalhado.
- Regras específicas de autenticação.

## Decisão profissional

```txt
Auth Service → identidade, login, sessão e senha
Backend      → autorização, tenant, RBAC e regras de negócio
Frontend     → interface e consumo seguro da API
Database     → Prisma, migrations e client
Common       → erros, Either, logger, helpers e contratos
```

## Por onde começar

Comece criando a estrutura base do monorepo e garantindo que cada app consiga rodar isoladamente.
