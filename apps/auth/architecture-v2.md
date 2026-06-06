# Authentication Architecture V2

## Objetivo

Construir um módulo de autenticação corporativo, escalável e desacoplado para aplicações SaaS multi-tenant.

A arquitetura deve suportar:

- Login por e-mail e senha
- Login por OTP
- Login por Magic Link
- Login Social (Google)
- Login Social (Facebook)
- Verificação de e-mail
- Sessões Redis
- RBAC
- Multi-Tenant
- Auditoria
- Session Rotation
- MFA Ready
- Passkeys Ready

---

# Arquitetura Geral

```txt
Frontend
    ↓
Auth Service
    ↓
Redis
    ↓
PostgreSQL
```

Responsabilidades:

```txt
Auth Service
 ├── Identidade
 ├── Sessões
 ├── OTP
 ├── Magic Link
 ├── OAuth
 ├── Verificação de E-mail
 └── Auditoria
```

```txt
Backend API
 ├── RBAC
 ├── Tenant
 ├── Organization
 ├── Regras de negócio
 └── Permissões
```

---

# Estrutura do Monorepo

```txt
apps/
│
├── auth-service
├── backend-api
└── frontend

packages/
│
├── common
├── database
│
├── auth-core
├── auth-prisma
├── auth-redis
├── auth-email
├── auth-fastify
│
├── auth-password
├── auth-otp
├── auth-magic-link
│
├── auth-oauth
├── auth-google
├── auth-facebook
│
└── notifications
```

---

# Auth Core

Contém:

```txt
Entidades
Value Objects
Use Cases
Contratos
DTOs
Eventos de Domínio
```

Não pode importar:

```txt
Prisma
Redis
Fastify
Nodemailer
Axios
Google SDK
Facebook SDK
```

---

# Providers de Autenticação

## Password

```txt
POST /auth/login
```

Fluxo:

```txt
Email
Senha
↓
Hash compare
↓
Cria sessão
```

---

## OTP

```txt
POST /auth/request-otp
POST /auth/validate-otp
```

Fluxo:

```txt
Email
↓
Gera OTP
↓
Hash OTP
↓
Envia Email
↓
Valida OTP
↓
Cria sessão
```

---

## Magic Link

```txt
POST /auth/request-magic-link

GET /auth/magic-link/verify
```

Fluxo:

```txt
Email
↓
Gera Token
↓
Envia Link
↓
Usuário clica
↓
Token validado
↓
Cria sessão
```

---

## Google OAuth

```txt
GET /auth/oauth/google
GET /auth/oauth/google/callback
```

Fluxo:

```txt
Google
↓
Authorization Code
↓
User Profile
↓
Resolve User
↓
Cria sessão
```

---

## Facebook OAuth

```txt
GET /auth/oauth/facebook
GET /auth/oauth/facebook/callback
```

Fluxo:

```txt
Facebook
↓
Authorization Code
↓
User Profile
↓
Resolve User
↓
Cria sessão
```

---

# Entidade User

```txt
User
 ├── id
 ├── email
 ├── passwordHash
 ├── emailVerified
 ├── firstName
 ├── lastName
 ├── createdAt
 └── updatedAt
```

---

# Entidade Account

Relaciona um usuário com provedores externos.

```txt
Account
 ├── provider
 ├── providerAccountId
 ├── email
 └── userId
```

Exemplos:

```txt
GOOGLE
FACEBOOK
PASSWORD
MAGIC_LINK
OTP_EMAIL
```

---

# Entidade Session

```txt
Session
 ├── id
 ├── userId
 ├── sessionTokenHash
 ├── expiresAt
 ├── ipAddress
 ├── userAgent
 └── createdAt
```

Banco:

```txt
Armazena apenas HASH
```

Nunca:

```txt
Token puro
```

---

# Entidade OTP

```txt
OtpCode
 ├── email
 ├── codeHash
 ├── purpose
 ├── attempts
 ├── expiresAt
 └── usedAt
```

---

# Entidade EmailVerification

```txt
EmailVerificationToken
 ├── userId
 ├── tokenHash
 ├── expiresAt
 └── usedAt
```

---

# Sessões

## Estratégia

```txt
Cookie HttpOnly
↓
Session Token
↓
Redis
↓
Postgres
```

---

## Session Rotation

Implementar:

```txt
RotateSessionUseCase
```

Fluxo:

```txt
Sessão antiga
↓
Revoga
↓
Cria nova
↓
Atualiza Cookie
```

---

# Redis

## Session Cache

```txt
session:{tokenHash}
```

---

## RBAC Cache

```txt
rbac:{userId}:{tenantId}
```

---

## Rate Limit

```txt
rate-limit:{ip}
```

---

# RBAC

## Membership

```txt
User
 ↓
Membership
 ↓
Tenant
 ↓
Role
 ↓
Permissions
```

---

## Cache

```txt
Redis
↓
Role
Permissions
Tenant
```

Evita query no banco a cada request.

---

# Email Verification

## Solicitar

```txt
POST /auth/request-email-verification
```

---

## Confirmar

```txt
GET /auth/verify-email
```

---

## Fluxo

```txt
Usuário
↓
Recebe Link
↓
Clica
↓
Token Validado
↓
emailVerified = now()
```

---

# Audit Log

Tabela:

```txt
AuditLog
```

Eventos:

```txt
LOGIN
LOGOUT
OTP_REQUESTED
OTP_VALIDATED
EMAIL_VERIFIED
MAGIC_LINK_SENT
MAGIC_LINK_LOGIN
GOOGLE_LOGIN
FACEBOOK_LOGIN
PASSWORD_CHANGED
SESSION_REVOKED
ROLE_CHANGED
```

---

# Value Objects

```txt
EmailVO
PasswordVO
OtpCodeVO
SessionTokenVO
VerificationTokenVO
MetadataVO
IpAddressVO
UserAgentVO
```

---

# Repositories

```txt
UserRepository
SessionRepository
OtpRepository
AccountRepository
AuditLogRepository
EmailVerificationRepository
```

---

# OAuth Provider Contract

```txt
OAuthProvider
```

Implementações:

```txt
GoogleOAuthProvider
FacebookOAuthProvider
```

Futuro:

```txt
GitHubOAuthProvider
MicrosoftOAuthProvider
AppleOAuthProvider
```

---

# Segurança

## Obrigatório

```txt
HttpOnly Cookie
Secure Cookie
SameSite=Lax
CSRF Protection
Session Rotation
Password Hash (Argon2)
OTP Expiration
Rate Limit
Audit Log
```

---

## Não permitido

```txt
Salvar senha pura
Salvar OTP puro
Salvar token puro
Retornar sessionToken em JSON
```

---

# MFA Roadmap

V3:

```txt
Email OTP
+
Senha
```

V4:

```txt
TOTP
Google Authenticator
Microsoft Authenticator
```

V5:

```txt
Passkeys
WebAuthn
```

---

# Fluxos Suportados

## Registro

```txt
Register
↓
Request Email Verification
↓
Verify Email
```

---

## Login Senha

```txt
Email
Senha
↓
Session
```

---

## Login OTP

```txt
Request OTP
↓
Validate OTP
↓
Session
```

---

## Login Magic Link

```txt
Request Magic Link
↓
Verify Link
↓
Session
```

---

## Login Google

```txt
Google OAuth
↓
Resolve User
↓
Session
```

---

## Login Facebook

```txt
Facebook OAuth
↓
Resolve User
↓
Session
```

---

# Resultado Final

A arquitetura suporta:

✅ Multi-Tenant
✅ RBAC
✅ Redis Session
✅ OAuth
✅ OTP
✅ Magic Link
✅ Email Verification
✅ Audit Log
✅ Session Rotation
✅ MFA Ready
✅ Passkeys Ready
✅ Clean Architecture
✅ DDD
✅ SOLID
✅ Monorepo Escalável
