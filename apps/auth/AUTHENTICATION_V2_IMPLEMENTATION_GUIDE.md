# Guia de Implementação — Authentication V2 em Monorepo

> Arquitetura para autenticação SaaS multi-tenant com **Session + Redis**, **RBAC**, **OTP**, **Magic Link**, **Email Verification**, **Google OAuth**, **Facebook OAuth**, **Zod**, **Fastify**, **Prisma**, **Clean Architecture** e separação por providers.

---

## 1. Objetivo

Este guia apresenta o passo a passo para implementar um módulo de autenticação profissional em monorepo, separando regras de domínio dos providers de infraestrutura.

A ideia central é:

```txt
auth-core
  Regras puras, contratos, entidades, value objects, use cases e DTOs

auth-prisma
  Repositories Prisma

auth-redis
  Session cache, RBAC cache e rate limit

auth-email
  Templates e providers de envio de e-mail

auth-password
  Login com e-mail e senha

auth-otp
  Login com OTP por e-mail

auth-magic-link
  Login por link mágico

auth-oauth
  Contratos OAuth genéricos

auth-google
  Provider OAuth Google

auth-facebook
  Provider OAuth Facebook

auth-fastify
  Controllers, schemas Zod, guards e helpers HTTP
```

---

## 2. Estrutura recomendada do monorepo

```txt
apps/
  auth-service/
    src/
      main.ts
      container/
        auth.container.ts
      modules/
        auth/
          auth.routes.ts

  backend/
    src/
      shared/
        auth/
        rbac/

  frontend/
    src/

packages/
  common/
  database/

  auth-core/
  auth-prisma/
  auth-redis/
  auth-email/
  auth-password/
  auth-otp/
  auth-magic-link/
  auth-oauth/
  auth-google/
  auth-facebook/
  auth-fastify/
```

---

## 3. Regra de dependência

```txt
auth-core
  não depende de Prisma
  não depende de Redis
  não depende de Fastify
  não depende de Google
  não depende de Facebook
  não depende de Nodemailer/Resend

auth-prisma
  depende de auth-core
  depende de database

auth-redis
  depende de auth-core
  depende de ioredis

auth-email
  depende de auth-core

auth-fastify
  depende de auth-core
  depende dos use cases
  depende de Fastify e Zod

apps/auth-service
  faz composition root
  injeta providers reais
```

---

## 4. Packages

### 4.1 `@repo/auth-core`

Responsável por:

```txt
- Entidades
- Value Objects
- Contratos de repositories
- Contratos de providers
- Serviços de domínio
- Use cases
- DTOs
```

Estrutura:

```txt
packages/auth-core/src/
  domain/
    entities/
      user.entity.ts
      session.entity.ts
      otp-code.entity.ts
      email-verification-token.entity.ts
      magic-link-token.entity.ts
      account.entity.ts
      audit-log.entity.ts

    enums/
      auth-provider.enum.ts
      otp-purpose.enum.ts

    repositories/
      user.repository.ts
      session.repository.ts
      session-cache.repository.ts
      otp.repository.ts
      magic-link.repository.ts
      email-verification.repository.ts
      account.repository.ts
      audit-log.repository.ts

    services/
      password-hasher.ts
      session-token.service.ts
      otp-code.service.ts
      verification-token.service.ts

    providers/
      email.service.ts
      oauth-provider.ts

  application/
    dto/
      auth.dto.ts
      otp.dto.ts
      magic-link.dto.ts
      email-verification.dto.ts
      oauth.dto.ts

    use-cases/
      register.use-case.ts
      login-with-password.use-case.ts
      logout.use-case.ts
      me.use-case.ts
      resolve-session.use-case.ts
      refresh-session.use-case.ts
      request-otp.use-case.ts
      validate-otp.use-case.ts
      request-magic-link.use-case.ts
      verify-magic-link.use-case.ts
      request-email-verification.use-case.ts
      verify-email.use-case.ts
      oauth-login.use-case.ts

  index.ts
```

---

### 4.2 `@repo/auth-prisma`

Responsável por implementar repositories com Prisma.

```txt
packages/auth-prisma/src/
  repositories/
    prisma-user.repository.ts
    prisma-session.repository.ts
    prisma-otp.repository.ts
    prisma-magic-link.repository.ts
    prisma-email-verification.repository.ts
    prisma-account.repository.ts
    prisma-audit-log.repository.ts

  mappers/
    prisma-user.mapper.ts
    prisma-session.mapper.ts
    prisma-audit-log.mapper.ts

  index.ts
```

---

### 4.3 `@repo/auth-redis`

Responsável por cache.

```txt
packages/auth-redis/src/
  redis-session-cache.repository.ts
  redis-rbac-context-cache.repository.ts
  redis-rate-limit.repository.ts
  index.ts
```

---

### 4.4 `@repo/auth-email`

Responsável por templates e providers de e-mail.

```txt
packages/auth-email/src/
  templates/
    otp-email.template.ts
    verify-email.template.ts
    magic-link-email.template.ts
    reset-password-email.template.ts

  providers/
    nodemailer-email.service.ts
    resend-email.service.ts

  index.ts
```

---

### 4.5 `@repo/auth-oauth`

Responsável por contratos e helpers OAuth genéricos.

```txt
packages/auth-oauth/src/
  oauth-state.service.ts
  oauth-provider.factory.ts
  index.ts
```

---

### 4.6 `@repo/auth-google`

```txt
packages/auth-google/src/
  google-oauth.provider.ts
  index.ts
```

---

### 4.7 `@repo/auth-facebook`

```txt
packages/auth-facebook/src/
  facebook-oauth.provider.ts
  index.ts
```

---

### 4.8 `@repo/auth-fastify`

Responsável por camada HTTP.

```txt
packages/auth-fastify/src/
  schemas/
    auth.schema.ts
    otp.schema.ts
    magic-link.schema.ts
    email-verification.schema.ts
    oauth.schema.ts

  controllers/
    register.controller.ts
    login-with-password.controller.ts
    logout.controller.ts
    me.controller.ts
    refresh-session.controller.ts
    request-otp.controller.ts
    validate-otp.controller.ts
    request-magic-link.controller.ts
    verify-magic-link.controller.ts
    request-email-verification.controller.ts
    verify-email.controller.ts
    oauth-start.controller.ts
    oauth-callback.controller.ts

  guards/
    auth.guard.ts
    csrf-origin.guard.ts
    verified-email.guard.ts

  helpers/
    extract-session-token.ts
    set-session-cookie.ts
    clear-session-cookie.ts

  index.ts
```

---

## 5. Modelagem Prisma sugerida

### 5.1 User

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String?   @map("password_hash")
  firstName     String?   @map("first_name") @db.VarChar(100)
  lastName      String?   @map("last_name") @db.VarChar(100)
  emailVerified DateTime? @map("email_verified")

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  accounts      Account[]
  sessions      Session[]

  @@map("users")
}
```

### 5.2 Account

```prisma
model Account {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @map("user_id") @db.Uuid

  provider          String   @db.VarChar(50)
  providerAccountId String   @map("provider_account_id") @db.VarChar(255)

  email             String?  @db.VarChar(255)
  accessToken       String?  @map("access_token") @db.Text
  refreshToken      String?  @map("refresh_token") @db.Text
  expiresAt         DateTime? @map("expires_at")

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime? @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}
```

### 5.3 Session

```prisma
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  sessionToken String   @unique @map("session_token") @db.VarChar(255)
  expires      DateTime @map("expired_at")

  ipAddress    String?  @map("ip_address") @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.VarChar(500)

  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime? @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
  @@index([deletedAt])
  @@index([userId, deletedAt])
  @@map("sessions")
}
```

### 5.4 OtpCode

```prisma
model OtpCode {
  id          String    @id @default(uuid()) @db.Uuid
  email       String    @db.VarChar(255)
  codeHash    String    @map("code_hash") @db.VarChar(255)
  purpose     String    @db.VarChar(50)

  attempts    Int       @default(0)
  maxAttempts Int       @default(5) @map("max_attempts")

  expiresAt   DateTime  @map("expires_at")
  usedAt      DateTime? @map("used_at")

  ipAddress   String?   @map("ip_address") @db.VarChar(45)
  userAgent   String?   @map("user_agent") @db.VarChar(500)

  createdAt   DateTime  @default(now()) @map("created_at")
  deletedAt   DateTime? @map("deleted_at")

  @@index([email])
  @@index([purpose])
  @@index([expiresAt])
  @@index([usedAt])
  @@map("otp_codes")
}
```

### 5.5 EmailVerificationToken

```prisma
model EmailVerificationToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)

  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")

  createdAt DateTime  @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

### 5.6 MagicLinkToken

```prisma
model MagicLinkToken {
  id        String    @id @default(uuid()) @db.Uuid
  email     String    @db.VarChar(255)
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)

  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")

  ipAddress String?   @map("ip_address") @db.VarChar(45)
  userAgent String?   @map("user_agent") @db.VarChar(500)

  createdAt DateTime  @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([email])
  @@index([expiresAt])
  @@map("magic_link_tokens")
}
```

### 5.7 AuditLog

```prisma
model AuditLog {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String?  @map("user_id") @db.Uuid
  tenantId       String?  @map("tenant_id") @db.Uuid
  organizationId String?  @map("organization_id") @db.Uuid

  action         String   @db.VarChar(100)
  resource       String   @db.VarChar(100)
  resourceId     String?  @map("resource_id") @db.VarChar(100)

  ipAddress      String?  @map("ip_address") @db.VarChar(45)
  userAgent      String?  @map("user_agent") @db.VarChar(500)
  metadata       Json?

  createdAt      DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([tenantId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 6. Enums do domínio

```ts
// packages/auth-core/src/domain/enums/auth-provider.enum.ts

export enum AuthProvider {
  PASSWORD = "PASSWORD",
  OTP_EMAIL = "OTP_EMAIL",
  MAGIC_LINK = "MAGIC_LINK",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
}
```

```ts
// packages/auth-core/src/domain/enums/otp-purpose.enum.ts

export enum OtpPurpose {
  LOGIN = "LOGIN",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
}
```

---

## 7. Value Objects necessários

```txt
@repo/common
  EmailVO
  PasswordVO
  PasswordHashVO
  UUIDVO
  IpAddressVO
  UserAgentVO
  MetadataVO
  SessionTokenVO
  OtpCodeVO
  VerificationTokenVO
```

---

## 8. Schemas Zod

### 8.1 Auth

```ts
// packages/auth-fastify/src/schemas/auth.schema.ts

import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(72),
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
});

export const LoginWithPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8).max(72),
});

export const EmptyBodySchema = z.object({}).optional();

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginWithPasswordDto = z.infer<typeof LoginWithPasswordSchema>;
```

### 8.2 OTP

```ts
// packages/auth-fastify/src/schemas/otp.schema.ts

import { z } from "zod";

export const RequestOtpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("LOGIN"),
});

export const ValidateOtpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve conter exatamente 6 dígitos"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("LOGIN"),
});

export type RequestOtpDto = z.infer<typeof RequestOtpSchema>;
export type ValidateOtpDto = z.infer<typeof ValidateOtpSchema>;
```

### 8.3 Magic Link

```ts
// packages/auth-fastify/src/schemas/magic-link.schema.ts

import { z } from "zod";

export const RequestMagicLinkSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const VerifyMagicLinkQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type RequestMagicLinkDto = z.infer<typeof RequestMagicLinkSchema>;
export type VerifyMagicLinkQueryDto = z.infer<typeof VerifyMagicLinkQuerySchema>;
```

### 8.4 Email Verification

```ts
// packages/auth-fastify/src/schemas/email-verification.schema.ts

import { z } from "zod";

export const RequestEmailVerificationSchema = z.object({}).optional();

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type VerifyEmailQueryDto = z.infer<typeof VerifyEmailQuerySchema>;
```

### 8.5 OAuth

```ts
// packages/auth-fastify/src/schemas/oauth.schema.ts

import { z } from "zod";

export const OAuthCallbackQuerySchema = z.object({
  code: z.string().min(1, "Code OAuth obrigatório"),
  state: z.string().min(1, "State OAuth obrigatório"),
});

export type OAuthCallbackQueryDto = z.infer<typeof OAuthCallbackQuerySchema>;
```

---

## 9. Lista de Use Cases

### 9.1 Autenticação base

```txt
RegisterUseCase
LoginWithPasswordUseCase
LogoutUseCase
MeUseCase
ResolveSessionUseCase
RefreshSessionUseCase
RotateSessionUseCase
```

### 9.2 OTP

```txt
RequestOtpUseCase
ValidateOtpUseCase
```

### 9.3 Magic Link

```txt
RequestMagicLinkUseCase
VerifyMagicLinkUseCase
```

### 9.4 Email Verification

```txt
RequestEmailVerificationUseCase
VerifyEmailUseCase
```

### 9.5 OAuth

```txt
GetOAuthAuthorizationUrlUseCase
OAuthLoginUseCase
```

### 9.6 Auditoria

```txt
CreateAuditLogUseCase
```

---

## 10. Lista de Controllers

### 10.1 Auth base

```txt
RegisterController
LoginWithPasswordController
LogoutController
MeController
RefreshSessionController
```

### 10.2 OTP

```txt
RequestOtpController
ValidateOtpController
```

### 10.3 Magic Link

```txt
RequestMagicLinkController
VerifyMagicLinkController
```

### 10.4 Email Verification

```txt
RequestEmailVerificationController
VerifyEmailController
```

### 10.5 OAuth

```txt
OAuthGoogleStartController
OAuthGoogleCallbackController
OAuthFacebookStartController
OAuthFacebookCallbackController
```

---

## 11. Contratos principais do `auth-core`

### 11.1 SessionRepository

```ts
export type CreateSessionInput = {
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export abstract class SessionRepository {
  abstract create(input: CreateSessionInput): Promise<SessionRecord>;

  abstract findValidByTokenHash(
    sessionTokenHash: string,
  ): Promise<SessionRecord | null>;

  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;

  abstract revokeAllByUserId(userId: string): Promise<void>;
}
```

### 11.2 SessionCacheRepository

```ts
export abstract class SessionCacheRepository {
  abstract set(session: SessionRecord): Promise<void>;

  abstract get(sessionTokenHash: string): Promise<SessionRecord | null>;

  abstract delete(sessionTokenHash: string): Promise<void>;
}
```

### 11.3 EmailService

```ts
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export abstract class EmailService {
  abstract send(input: SendEmailInput): Promise<void>;
}
```

### 11.4 OAuthProvider

```ts
import { AuthProvider } from "../enums/auth-provider.enum";

export type OAuthUserProfile = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  avatarUrl?: string | null;
};

export abstract class OAuthProvider {
  abstract provider: AuthProvider;

  abstract getAuthorizationUrl(input: {
    state: string;
    redirectUri: string;
  }): string;

  abstract getUserProfile(input: {
    code: string;
    redirectUri: string;
  }): Promise<OAuthUserProfile>;
}
```

---

## 12. Passo a passo de implementação

### Etapa 1 — Criar packages

```bash
mkdir -p packages/auth-core/src
mkdir -p packages/auth-prisma/src
mkdir -p packages/auth-redis/src
mkdir -p packages/auth-email/src
mkdir -p packages/auth-password/src
mkdir -p packages/auth-otp/src
mkdir -p packages/auth-magic-link/src
mkdir -p packages/auth-oauth/src
mkdir -p packages/auth-google/src
mkdir -p packages/auth-facebook/src
mkdir -p packages/auth-fastify/src
```

---

### Etapa 2 — Criar `package.json` de cada package

Exemplo `auth-core`:

```json
{
  "name": "@repo/auth-core",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@repo/common": "workspace:*"
  }
}
```

Exemplo `auth-prisma`:

```json
{
  "name": "@repo/auth-prisma",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@repo/auth-core": "workspace:*",
    "@repo/common": "workspace:*",
    "@repo/database": "workspace:*"
  }
}
```

Exemplo `auth-fastify`:

```json
{
  "name": "@repo/auth-fastify",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@repo/auth-core": "workspace:*",
    "fastify": "^5.0.0",
    "zod": "^3.24.0"
  }
}
```

---

### Etapa 3 — Atualizar `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### Etapa 4 — Criar models Prisma

Adicione os models:

```txt
User
Account
Session
OtpCode
EmailVerificationToken
MagicLinkToken
AuditLog
```

Depois rode:

```bash
pnpm prisma migrate dev --name auth_v2
pnpm prisma generate
```

---

### Etapa 5 — Criar Value Objects em `@repo/common`

Crie:

```txt
EmailVO
PasswordVO
PasswordHashVO
SessionTokenVO
OtpCodeVO
VerificationTokenVO
MetadataVO
IpAddressVO
UserAgentVO
```

---

### Etapa 6 — Criar contratos em `auth-core`

Crie:

```txt
UserRepository
SessionRepository
SessionCacheRepository
OtpRepository
MagicLinkRepository
EmailVerificationRepository
AccountRepository
AuditLogRepository
EmailService
OAuthProvider
PasswordHasher
```

---

### Etapa 7 — Criar services em `auth-core`

Crie:

```txt
SessionTokenService
OtpCodeService
VerificationTokenService
```

---

### Etapa 8 — Criar use cases em `auth-core`

Implemente na ordem:

```txt
1. RegisterUseCase
2. LoginWithPasswordUseCase
3. ResolveSessionUseCase
4. LogoutUseCase
5. MeUseCase
6. RefreshSessionUseCase
7. RequestOtpUseCase
8. ValidateOtpUseCase
9. RequestMagicLinkUseCase
10. VerifyMagicLinkUseCase
11. RequestEmailVerificationUseCase
12. VerifyEmailUseCase
13. OAuthLoginUseCase
14. CreateAuditLogUseCase
```

---

### Etapa 9 — Criar repositories Prisma

Em `auth-prisma`:

```txt
PrismaUserRepository
PrismaSessionRepository
PrismaOtpRepository
PrismaMagicLinkRepository
PrismaEmailVerificationRepository
PrismaAccountRepository
PrismaAuditLogRepository
```

---

### Etapa 10 — Criar Redis repositories

Em `auth-redis`:

```txt
RedisSessionCacheRepository
RedisRbacContextCacheRepository
RedisRateLimitRepository
```

---

### Etapa 11 — Criar e-mail templates

Em `auth-email`:

```txt
OtpEmailTemplate
MagicLinkEmailTemplate
VerifyEmailTemplate
ResetPasswordEmailTemplate
```

---

### Etapa 12 — Criar providers OAuth

Em `auth-google`:

```txt
GoogleOAuthProvider
```

Em `auth-facebook`:

```txt
FacebookOAuthProvider
```

---

### Etapa 13 — Criar schemas Zod em `auth-fastify`

Crie:

```txt
auth.schema.ts
otp.schema.ts
magic-link.schema.ts
email-verification.schema.ts
oauth.schema.ts
```

---

### Etapa 14 — Criar controllers em `auth-fastify`

Implemente:

```txt
RegisterController
LoginWithPasswordController
LogoutController
MeController
RefreshSessionController
RequestOtpController
ValidateOtpController
RequestMagicLinkController
VerifyMagicLinkController
RequestEmailVerificationController
VerifyEmailController
OAuthGoogleStartController
OAuthGoogleCallbackController
OAuthFacebookStartController
OAuthFacebookCallbackController
```

---

### Etapa 15 — Criar helpers HTTP

```txt
extract-session-token.ts
set-session-cookie.ts
clear-session-cookie.ts
```

---

### Etapa 16 — Criar composition root

No app:

```txt
apps/auth-service/src/container/auth.container.ts
```

Esse arquivo deve instanciar:

```txt
Prisma repositories
Redis repositories
Email provider
OAuth providers
Use cases
Controllers
```

---

## 13. Exemplo de controller com Zod

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { LoginWithPasswordUseCase } from "@repo/auth-core";
import { LoginWithPasswordSchema } from "../schemas/auth.schema";
import { setSessionCookie } from "../helpers/set-session-cookie";

export class LoginWithPasswordController {
  constructor(
    private readonly loginWithPasswordUseCase: LoginWithPasswordUseCase,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = LoginWithPasswordSchema.parse(request.body);

    const result = await this.loginWithPasswordUseCase.execute(body, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    setSessionCookie(reply, {
      token: result.value.sessionToken,
      expiresAt: result.value.expiresAt,
    });

    return reply.status(200).send({
      user: result.value.user,
      expiresAt: result.value.expiresAt,
    });
  }
}
```

---

## 14. Exemplo de rotas Fastify

```ts
import { FastifyInstance } from "fastify";

export async function authRoutes(
  app: FastifyInstance,
  controllers: {
    registerController: { handle: Function };
    loginWithPasswordController: { handle: Function };
    logoutController: { handle: Function };
    meController: { handle: Function };
    requestOtpController: { handle: Function };
    validateOtpController: { handle: Function };
    requestMagicLinkController: { handle: Function };
    verifyMagicLinkController: { handle: Function };
    requestEmailVerificationController: { handle: Function };
    verifyEmailController: { handle: Function };
    oauthGoogleStartController: { handle: Function };
    oauthGoogleCallbackController: { handle: Function };
    oauthFacebookStartController: { handle: Function };
    oauthFacebookCallbackController: { handle: Function };
  },
) {
  app.post("/auth/register", controllers.registerController.handle.bind(controllers.registerController));
  app.post("/auth/login", controllers.loginWithPasswordController.handle.bind(controllers.loginWithPasswordController));
  app.post("/auth/logout", controllers.logoutController.handle.bind(controllers.logoutController));
  app.get("/auth/me", controllers.meController.handle.bind(controllers.meController));

  app.post("/auth/request-otp", controllers.requestOtpController.handle.bind(controllers.requestOtpController));
  app.post("/auth/validate-otp", controllers.validateOtpController.handle.bind(controllers.validateOtpController));

  app.post("/auth/request-magic-link", controllers.requestMagicLinkController.handle.bind(controllers.requestMagicLinkController));
  app.get("/auth/magic-link/verify", controllers.verifyMagicLinkController.handle.bind(controllers.verifyMagicLinkController));

  app.post("/auth/request-email-verification", controllers.requestEmailVerificationController.handle.bind(controllers.requestEmailVerificationController));
  app.get("/auth/verify-email", controllers.verifyEmailController.handle.bind(controllers.verifyEmailController));

  app.get("/auth/oauth/google", controllers.oauthGoogleStartController.handle.bind(controllers.oauthGoogleStartController));
  app.get("/auth/oauth/google/callback", controllers.oauthGoogleCallbackController.handle.bind(controllers.oauthGoogleCallbackController));

  app.get("/auth/oauth/facebook", controllers.oauthFacebookStartController.handle.bind(controllers.oauthFacebookStartController));
  app.get("/auth/oauth/facebook/callback", controllers.oauthFacebookCallbackController.handle.bind(controllers.oauthFacebookCallbackController));
}
```

---

## 15. Variáveis de ambiente

```env
PORT=3334

DATABASE_URL=postgresql://app:app@localhost:5432/app
REDIS_URL=redis://localhost:6379

AUTH_SERVICE_URL=http://localhost:3334
FRONTEND_URL=http://localhost:3000

SESSION_COOKIE_NAME=sid
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_SECURE=false

OTP_EXPIRES_IN_MINUTES=10
OTP_MAX_ATTEMPTS=5

MAGIC_LINK_EXPIRES_IN_MINUTES=15
EMAIL_VERIFICATION_EXPIRES_IN_HOURS=24

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

---

## 16. Checklist de testes

### Auth base

```txt
- Deve registrar usuário
- Deve impedir e-mail duplicado
- Deve logar com senha válida
- Deve negar senha inválida
- Deve criar sessão no banco
- Deve salvar sessão no Redis
- Deve limpar cookie no logout
```

### OTP

```txt
- Deve solicitar OTP sem revelar se e-mail existe
- Deve salvar apenas hash do OTP
- Deve validar OTP correto
- Deve negar OTP expirado
- Deve limitar tentativas
- Deve marcar OTP como usado
```

### Magic Link

```txt
- Deve gerar token
- Deve enviar link por e-mail
- Deve salvar apenas hash do token
- Deve validar link
- Deve negar token usado
- Deve criar sessão após validação
```

### Email Verification

```txt
- Deve gerar token de verificação
- Deve marcar emailVerified
- Deve negar token expirado
- Deve negar token usado
```

### OAuth

```txt
- Deve gerar URL Google
- Deve validar callback Google
- Deve resolver/criar usuário
- Deve criar Account
- Deve criar sessão
- Deve validar state
```

### Segurança

```txt
- Não salvar senha pura
- Não salvar OTP puro
- Não salvar token puro
- Não retornar sessionToken no JSON
- Cookie precisa ser httpOnly
- Cookie precisa ser secure em produção
- Login deve ter rate limit
```

---

## 17. Ordem de entrega recomendada

```txt
Sprint 1
  auth-core
  auth-prisma
  auth-redis
  login com senha
  session + cookie

Sprint 2
  OTP
  Email Verification
  Magic Link

Sprint 3
  Google OAuth
  Facebook OAuth
  Audit Log

Sprint 4
  RBAC Cache
  Rate Limit
  Session Rotation
  Observabilidade
```

---

## 18. Resultado esperado

Ao final, o projeto terá:

```txt
- Autenticação desacoplada por providers
- Session Redis segura
- Cookie httpOnly
- OTP por e-mail
- Magic Link
- Verificação de e-mail
- Google OAuth
- Facebook OAuth
- Auditoria
- Zod em todos os controllers
- Domínio sem dependência de Prisma/Fastify/Redis
- Providers substituíveis
- Pronto para MFA, TOTP, Passkeys, GitHub, Apple e Microsoft
```
