# 08 — Next.js Auth

## Responsabilidade

Integrar o frontend Next.js com o backend e o auth-service de forma segura.

## Escopo

Este guia define login, logout, SSR, cookies e rotas protegidas.

## Recomendação principal

```txt
httpOnly Cookie + Redis
```

## O que implementar

```txt
api client
login action
logout action
middleware.ts
getCurrentUser
protected layouts
refresh session
```

## Fluxo com cookie httpOnly

```txt
Usuário faz login
  ↓
Backend cria session
  ↓
Set-Cookie httpOnly
  ↓
Next.js envia cookie automaticamente
  ↓
SSR consegue validar usuário
```

## O que evitar

- Salvar token sensível em localStorage.
- Expor sessionToken para JavaScript.
- Validar permissões só no frontend.

## Próximo passo

Depois do Next.js, implemente observabilidade.
