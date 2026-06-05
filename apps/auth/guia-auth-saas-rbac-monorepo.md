# Guia Profissional — Módulo de Autenticação SaaS com RBAC em Monorepo

> Projeto base: monorepo com `auth-service`, `backend`, `frontend`, `database` e `common`.
>
> Stack sugerida: TypeScript, Fastify, Prisma, PostgreSQL, Zod, Axios, JWT, Bcrypt e arquitetura limpa.

---

## 1. Objetivo do documento

Este documento orienta a implantação de um módulo de autenticação separado em um monorepo, rodando como serviço independente, com suporte a SaaS multi-tenant e autorização RBAC.

A ideia principal é separar responsabilidades:

```txt
Auth Service  → autenticação, sessão, login, senha, tokens e identidade
Backend       → autorização, permissões, tenant, organization e regras do sistema
Frontend      → interface, login e consumo da API principal
Database      → Prisma schema, migrations e client compartilhado
Common        → tipos, erros, logger, helpers, contratos e utilitários
```

---

## 2. Visão geral da arquitetura

```txt
apps/
  auth-service/
    src/
      modules/
        auth/
        users/

  backend/
    src/
      modules/
        memberships/
        organizations/
        tenants/
      shared/
        auth/
        rbac/
        http/

  frontend/
    src/

packages/
  common/
  database/
  contracts/
```

### Fluxo principal

```txt
1. Frontend chama o backend
2. Backend envia login para o auth-service
3. Auth-service valida usuário e senha
4. Auth-service retorna accessToken e refreshToken
5. Frontend usa accessToken nas próximas requisições
6. Backend valida o token
7. Backend busca Membership do usuário
8. Backend valida tenant, organization, role e permission
9. Controller executa a regra protegida
```

---

## 3. Portas dos serviços

```txt
frontend      → http://localhost:3000
backend       → http://localhost:3333
auth-service  → http://localhost:3334
```

### `.env` do backend

```env
PORT=3333
AUTH_SERVICE_URL=http://localhost:3334
JWT_SECRET=super-secret
```

### `.env` do auth-service

```env
PORT=3334
DATABASE_URL=postgresql://user:password@localhost:5432/app
JWT_SECRET=super-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
```

---

## 4. Responsabilidades por aplicação

## 4.1 Auth Service

Responsável por:

- Registro de usuário
- Login
- Geração de access token
- Geração de refresh token
- Revogação de token
- Recuperação de senha
- Verificação de e-mail
- OTP opcional
- Consulta `/auth/me`

Não deve decidir permissões do SaaS.

## 4.2 Backend

Responsável por:

- Validar token JWT
- Resolver tenant atual
- Resolver organization atual
- Buscar Membership do usuário
- Aplicar RBAC
- Aplicar regras de negócio
- Proteger rotas administrativas

## 4.3 Database

Responsável por:

- Schema Prisma
- Migrations
- Prisma Client
- Repositórios concretos

## 4.4 Common

Responsável por:

- Erros compartilhados
- Either/result pattern
- Logger
- Value Objects
- Tipos comuns
- Helpers de schema
- Enums compartilhados

---

## 5. Modelagem SaaS com RBAC

A modelagem central para permissão SaaS é:

```txt
User
 └── Membership
      ├── tenantId
      ├── organizationId
      ├── role
      └── status
```

### Exemplo conceitual

```txt
Usuário João
  ├── Tenant: Empresa A
  │    └── Organization: Loja Centro
  │         └── Role: ADMIN
  │
  └── Tenant: Empresa B
       └── Organization: Filial Norte
            └── Role: OPERATOR
```

O mesmo usuário pode ter permissões diferentes em empresas diferentes.

---

## 6. Roles recomendadas

```ts
export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  FINANCE = "FINANCE",
  SUPPORT = "SUPPORT",
  OPERATOR = "OPERATOR",
  AFFILIATE = "AFFILIATE",
  MEMBER = "MEMBER",
  CUSTOMER = "CUSTOMER",
}
```

### Descrição das roles

| Role | Descrição |
|---|---|
| OWNER | Dono do tenant. Tem acesso total. |
| ADMIN | Administra usuários, configurações e módulos. |
| MANAGER | Gerencia operação, mas sem controle total. |
| FINANCE | Acessa pagamentos, cobranças e planos. |
| SUPPORT | Acessa suporte e leitura de usuários. |
| OPERATOR | Opera módulos como hotspot, vouchers e atendimento. |
| AFFILIATE | Acessa recursos de afiliado/parceiro. |
| MEMBER | Usuário interno comum. |
| CUSTOMER | Cliente final com acesso limitado. |

---

## 7. Permissões recomendadas

```ts
export enum Permission {
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  TENANT_READ = "tenant:read",
  TENANT_UPDATE = "tenant:update",

  ORGANIZATION_CREATE = "organization:create",
  ORGANIZATION_READ = "organization:read",
  ORGANIZATION_UPDATE = "organization:update",
  ORGANIZATION_DELETE = "organization:delete",

  MEMBERSHIP_INVITE = "membership:invite",
  MEMBERSHIP_READ = "membership:read",
  MEMBERSHIP_UPDATE = "membership:update",
  MEMBERSHIP_REMOVE = "membership:remove",

  PAYMENT_READ = "payment:read",
  PAYMENT_CREATE = "payment:create",
  PAYMENT_REFUND = "payment:refund",

  PLAN_READ = "plan:read",
  PLAN_CREATE = "plan:create",
  PLAN_UPDATE = "plan:update",
  PLAN_DELETE = "plan:delete",

  HOTSPOT_READ = "hotspot:read",
  HOTSPOT_MANAGE = "hotspot:manage",

  VOUCHER_CREATE = "voucher:create",
  VOUCHER_READ = "voucher:read",
  VOUCHER_REVOKE = "voucher:revoke",

  REPORT_READ = "report:read",
  SETTINGS_UPDATE = "settings:update",
}
```

---

## 8. Mapa RBAC

Arquivo sugerido:

```txt
apps/backend/src/shared/rbac/role-permissions.ts
```

```ts
import { Permission } from "./permissions";
import { Role } from "./roles";

/**
 * Mapa central de permissões por perfil.
 *
 * Por que usar este arquivo?
 * - Evita espalhar regras de permissão pelos controllers.
 * - Facilita manutenção.
 * - Permite revisar segurança em um único lugar.
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.TENANT_READ,
    Permission.ORGANIZATION_CREATE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.MEMBERSHIP_INVITE,
    Permission.MEMBERSHIP_READ,
    Permission.MEMBERSHIP_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PLAN_READ,
    Permission.PLAN_CREATE,
    Permission.PLAN_UPDATE,
    Permission.HOTSPOT_READ,
    Permission.HOTSPOT_MANAGE,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_READ,
    Permission.REPORT_READ,
    Permission.SETTINGS_UPDATE,
  ],

  [Role.MANAGER]: [
    Permission.USER_READ,
    Permission.ORGANIZATION_READ,
    Permission.MEMBERSHIP_READ,
    Permission.PAYMENT_READ,
    Permission.PLAN_READ,
    Permission.HOTSPOT_READ,
    Permission.VOUCHER_READ,
    Permission.REPORT_READ,
  ],

  [Role.FINANCE]: [
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_REFUND,
    Permission.PLAN_READ,
    Permission.REPORT_READ,
  ],

  [Role.SUPPORT]: [
    Permission.USER_READ,
    Permission.MEMBERSHIP_READ,
    Permission.HOTSPOT_READ,
    Permission.VOUCHER_READ,
  ],

  [Role.OPERATOR]: [
    Permission.HOTSPOT_READ,
    Permission.HOTSPOT_MANAGE,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_READ,
  ],

  [Role.AFFILIATE]: [
    Permission.REPORT_READ,
  ],

  [Role.MEMBER]: [
    Permission.ORGANIZATION_READ,
  ],

  [Role.CUSTOMER]: [],
};
```

---

## 9. Auth Service Client no backend

Arquivo:

```txt
apps/backend/src/shared/http/clients/auth-service.client.ts
```

```ts
import axios, { AxiosInstance } from "axios";

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUserResponse = {
  id: string;
  email: string;
  emailVerified: Date | null;
};

export type AuthResponse = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
};

/**
 * Client HTTP responsável por comunicação entre backend e auth-service.
 *
 * Responsabilidade:
 * - Isolar chamadas HTTP externas.
 * - Evitar axios espalhado pelos use cases/controllers.
 * - Facilitar testes com mock deste client.
 */
export class AuthServiceClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.AUTH_SERVICE_URL,
      timeout: 5000,
    });
  }

  /**
   * Envia credenciais para o auth-service e retorna tokens.
   *
   * @param input email e senha informados pelo usuário
   * @returns usuário autenticado, accessToken e refreshToken
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/login", input);

    return response.data;
  }

  /**
   * Consulta o usuário autenticado no auth-service.
   *
   * Útil quando o backend prefere delegar a validação do token para o auth-service.
   */
  async me(accessToken: string): Promise<AuthUserResponse> {
    const response = await this.http.get<AuthUserResponse>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Solicita renovação de tokens usando refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  }

  /**
   * Solicita logout/revogação do refresh token.
   */
  async logout(refreshToken: string): Promise<void> {
    await this.http.post("/auth/logout", {
      refreshToken,
    });
  }
}
```

---

## 10. Controller proxy de login no backend

Arquivo:

```txt
apps/backend/src/modules/auth/controllers/login.controller.ts
```

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, Post, Validate } from "@/common/infrastructure/http/decorators";
import { AuthServiceClient } from "@/shared/http/clients/auth-service.client";
import { LoginSchema } from "../schemas/login.schema";

@Controller("/auth")
export class LoginController {
  static inject = [AuthServiceClient];

  constructor(private readonly authServiceClient: AuthServiceClient) {}

  /**
   * Proxy de login.
   *
   * O frontend chama o backend.
   * O backend chama o auth-service.
   *
   * Vantagem:
   * - O frontend não precisa conhecer a URL interna do auth-service.
   * - O backend pode adicionar logs, rate limit, auditoria e headers.
   */
  @Validate({ body: LoginSchema })
  @Post("/login", {
    tags: ["Auth"],
    summary: "Realiza login do usuário",
    description: "Encaminha as credenciais para o auth-service e retorna tokens.",
    body: LoginSchema,
    responses: {
      200: { description: "Login realizado com sucesso" },
      401: { description: "Credenciais inválidas" },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      email: string;
      password: string;
    };

    const result = await this.authServiceClient.login(body);

    return reply.status(200).send(result);
  }
}
```

---

## 11. Schemas de Auth no backend

Arquivo:

```txt
apps/backend/src/modules/auth/schemas/login.schema.ts
```

```ts
import { z } from "zod";

/**
 * Schema de entrada do login.
 *
 * Por que usar Zod?
 * - Valida entrada antes do controller executar.
 * - Gera tipos inferidos.
 * - Evita dados inválidos chegando no use case.
 */
export const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type LoginDto = z.infer<typeof LoginSchema>;
```

---

## 12. Auth Guard no backend

Arquivo:

```txt
apps/backend/src/shared/auth/auth.guard.ts
```

```ts
import { FastifyReply, FastifyRequest } from "fastify";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

/**
 * Guard de autenticação.
 *
 * Responsabilidade:
 * - Verificar se existe token Bearer.
 * - Validar JWT.
 * - Popular request.user com dados mínimos do usuário.
 *
 * Importante:
 * - Este guard NÃO valida permissão.
 * - Permissão é responsabilidade do RBAC guard.
 */
export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return reply.status(401).send({
      message: "Token de autenticação não informado.",
    });
  }

  const [, token] = authorization.split(" ");

  if (!token) {
    return reply.status(401).send({
      message: "Token de autenticação inválido.",
    });
  }

  try {
    const payload = await request.jwtVerify<{
      sub: string;
      email: string;
    }>();

    request.user = {
      id: payload.sub,
      email: payload.email,
    } as AuthenticatedUser;
  } catch {
    return reply.status(401).send({
      message: "Token expirado ou inválido.",
    });
  }
}
```

---

## 13. Tipagem global do Fastify

Arquivo:

```txt
apps/backend/src/@types/fastify.d.ts
```

```ts
import "fastify";
import { AuthenticatedUser } from "../shared/auth/auth.guard";
import { Permission } from "../shared/rbac/permissions";
import { Role } from "../shared/rbac/roles";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    auth?: {
      user: AuthenticatedUser;
      tenantId: string;
      organizationId?: string;
      role: Role;
      permissions: Permission[];
    };
  }
}
```

---

## 14. Membership Repository

Arquivo:

```txt
apps/backend/src/modules/memberships/domain/repositories/membership.repository.ts
```

```ts
import { Role } from "@/shared/rbac/roles";

export type ActiveMembership = {
  id: string;
  userId: string;
  tenantId: string;
  organizationId: string | null;
  role: Role;
};

export type FindActiveMembershipInput = {
  userId: string;
  tenantId: string;
  organizationId?: string;
};

/**
 * Contrato de acesso a memberships.
 *
 * O RBAC depende deste contrato para descobrir:
 * - Se o usuário pertence ao tenant.
 * - Qual role ele possui.
 * - Se a membership está ativa.
 */
export abstract class MembershipRepository {
  abstract findActive(
    input: FindActiveMembershipInput,
  ): Promise<ActiveMembership | null>;
}
```

---

## 15. PrismaMembershipRepository

Arquivo:

```txt
apps/backend/src/modules/memberships/infrastructure/database/prisma-membership.repository.ts
```

```ts
import { PrismaDatabase } from "@/common/infrastructure/db/prisma-repository";
import {
  ActiveMembership,
  FindActiveMembershipInput,
  MembershipRepository,
} from "../../domain/repositories/membership.repository";
import { Role } from "@/shared/rbac/roles";

export class PrismaMembershipRepository extends MembershipRepository {
  constructor(private readonly prisma: PrismaDatabase) {
    super();
  }

  /**
   * Busca membership ativa para um usuário dentro de um tenant/organization.
   *
   * Regras:
   * - userId precisa bater com o usuário autenticado.
   * - tenantId precisa ser informado pelo header/contexto.
   * - organizationId é opcional, pois alguns recursos são do tenant inteiro.
   * - status precisa ser ACTIVE.
   * - deletedAt precisa ser null.
   */
  async findActive(
    input: FindActiveMembershipInput,
  ): Promise<ActiveMembership | null> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: input.userId,
        tenantId: input.tenantId,
        organizationId: input.organizationId ?? undefined,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        organizationId: true,
        role: true,
      },
    });

    if (!membership) return null;

    return {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      organizationId: membership.organizationId,
      role: membership.role as Role,
    };
  }
}
```

---

## 16. RBAC Guard

Arquivo:

```txt
apps/backend/src/shared/rbac/can.guard.ts
```

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { MembershipRepository } from "@/modules/memberships/domain/repositories/membership.repository";
import { Permission } from "./permissions";
import { rolePermissions } from "./role-permissions";

/**
 * Factory de autorização por permissão.
 *
 * Exemplo:
 * preHandler: [authGuard, can(Permission.USER_CREATE, membershipRepository)]
 */
export function can(
  requiredPermission: Permission,
  membershipRepository: MembershipRepository,
) {
  return async function rbacGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        message: "Usuário não autenticado.",
      });
    }

    const tenantId = request.headers["x-tenant-id"] as string | undefined;
    const organizationId = request.headers["x-organization-id"] as
      | string
      | undefined;

    if (!tenantId) {
      return reply.status(400).send({
        message: "Header x-tenant-id é obrigatório.",
      });
    }

    const membership = await membershipRepository.findActive({
      userId: user.id,
      tenantId,
      organizationId,
    });

    if (!membership) {
      return reply.status(403).send({
        message: "Usuário não pertence a este tenant ou organização.",
      });
    }

    const permissions = rolePermissions[membership.role] ?? [];

    if (!permissions.includes(requiredPermission)) {
      return reply.status(403).send({
        message: "Usuário não possui permissão para esta ação.",
      });
    }

    request.auth = {
      user,
      tenantId,
      organizationId,
      role: membership.role,
      permissions,
    };
  };
}
```

---

## 17. Exemplo prático de rota protegida

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, Post } from "@/common/infrastructure/http/decorators";
import { authGuard } from "@/shared/auth/auth.guard";
import { can } from "@/shared/rbac/can.guard";
import { Permission } from "@/shared/rbac/permissions";
import { PrismaMembershipRepository } from "@/modules/memberships/infrastructure/database/prisma-membership.repository";

@Controller("/users")
export class CreateUserController {
  static inject = [PrismaMembershipRepository];

  constructor(
    private readonly membershipRepository: PrismaMembershipRepository,
  ) {}

  /**
   * Cria usuário protegido por autenticação e autorização.
   *
   * Requisitos:
   * - Usuário precisa estar autenticado.
   * - Usuário precisa pertencer ao tenant informado.
   * - Role do usuário precisa possuir user:create.
   */
  @Post("/", {
    tags: ["Users"],
    summary: "Cria usuário",
    preHandler: [
      authGuard,
      function (request, reply) {
        return can(
          Permission.USER_CREATE,
          this.membershipRepository,
        )(request, reply);
      },
    ],
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const auth = request.auth;

    return reply.status(201).send({
      message: "Usuário criado com sucesso.",
      tenantId: auth?.tenantId,
      role: auth?.role,
    });
  }
}
```

> Observação: dependendo do seu sistema de decorators/injeção, pode ser melhor criar `preHandler` por factory no módulo de rotas, em vez de usar `this` dentro do decorator.

---

## 18. Auth Service — schemas

Arquivo:

```txt
apps/auth-service/src/modules/auth/infrastructure/http/schemas/auth.schema.ts
```

```ts
import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(20),
});

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.date().nullable(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
```

---

## 19. Auth Service — DTOs

Arquivo:

```txt
apps/auth-service/src/modules/auth/application/dto/auth.dto.ts
```

```ts
import { z } from "zod";
import {
  AuthResponseSchema,
  LoginSchema,
  LogoutSchema,
  RefreshTokenSchema,
  RegisterSchema,
} from "../../infrastructure/http/schemas/auth.schema";

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type LogoutDto = z.infer<typeof LogoutSchema>;
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
```

---

## 20. Auth Service — TokenService

Arquivo:

```txt
apps/auth-service/src/modules/auth/domain/services/token.service.ts
```

```ts
export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export abstract class TokenService {
  abstract signAccessToken(payload: AccessTokenPayload): Promise<string>;

  abstract generateRefreshToken(): Promise<string>;

  abstract hashToken(token: string): Promise<string>;
}
```

Implementação:

```txt
apps/auth-service/src/modules/auth/infrastructure/providers/jwt-token.service.ts
```

```ts
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { TokenService, AccessTokenPayload } from "../../domain/services/token.service";

export class JwtTokenService extends TokenService {
  /**
   * Gera access token curto.
   *
   * O token carrega apenas identidade.
   * Permissões ficam no backend, pois podem mudar a qualquer momento.
   */
  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return jwt.sign(
      {
        email: payload.email,
      },
      process.env.JWT_SECRET!,
      {
        subject: payload.sub,
        expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
      },
    );
  }

  /**
   * Gera refresh token aleatório.
   *
   * Nunca salve o refresh token puro no banco.
   * Salve apenas o hash.
   */
  async generateRefreshToken(): Promise<string> {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * Gera hash SHA-256 para armazenar token com segurança.
   */
  async hashToken(token: string): Promise<string> {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
```

---

## 21. Auth Service — AuthTokenRepository

Arquivo:

```txt
apps/auth-service/src/modules/auth/domain/repositories/auth-token.repository.ts
```

```ts
export type CreateRefreshTokenInput = {
  userId: string;
  valueHash: string;
  expiredAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  valueHash: string;
  expiredAt: Date;
  revokedAt: Date | null;
};

export abstract class AuthTokenRepository {
  abstract createRefreshToken(input: CreateRefreshTokenInput): Promise<void>;

  abstract findValidRefreshToken(
    valueHash: string,
  ): Promise<RefreshTokenRecord | null>;

  abstract revokeRefreshToken(id: string): Promise<void>;
}
```

---

## 22. Auth Service — PrismaAuthTokenRepository

Arquivo:

```txt
apps/auth-service/src/modules/auth/infrastructure/database/prisma-auth-token.repository.ts
```

```ts
import { PrismaDatabase } from "@/common/infrastructure/db/prisma-repository";
import {
  AuthTokenRepository,
  CreateRefreshTokenInput,
  RefreshTokenRecord,
} from "../../domain/repositories/auth-token.repository";

export class PrismaAuthTokenRepository extends AuthTokenRepository {
  constructor(private readonly prisma: PrismaDatabase) {
    super();
  }

  /**
   * Persiste refresh token hasheado no banco.
   */
  async createRefreshToken(input: CreateRefreshTokenInput): Promise<void> {
    await this.prisma.token.create({
      data: {
        userId: input.userId,
        type: "REFRESH",
        valueHash: input.valueHash,
        expiredAt: input.expiredAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Busca token válido.
   *
   * Um token válido precisa:
   * - Ter hash igual ao recebido.
   * - Não estar revogado.
   * - Não estar deletado.
   * - Não estar expirado.
   */
  async findValidRefreshToken(
    valueHash: string,
  ): Promise<RefreshTokenRecord | null> {
    const token = await this.prisma.token.findFirst({
      where: {
        valueHash,
        type: "REFRESH",
        revokedAt: null,
        deletedAt: null,
        expiredAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        valueHash: true,
        expiredAt: true,
        revokedAt: true,
      },
    });

    if (!token) return null;

    return token;
  }

  /**
   * Revoga refresh token.
   */
  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.token.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
```

---

## 23. Auth Service — LoginUseCase

Arquivo:

```txt
apps/auth-service/src/modules/auth/application/use-cases/login.use-case.ts
```

```ts
import { Either, left, right } from "@/common/domain/errors/handle-errors/either";
import { UnauthorizedError } from "@/common/domain/errors/usecases/unauthorized.error";
import { BcryptHasher } from "@/common/shared/cryptography/bcrypt-hasher";
import { PrismaUserRepository } from "@/modules/users/infrastructure/database/prisma-user.repository";
import { AuthTokenRepository } from "../../domain/repositories/auth-token.repository";
import { TokenService } from "../../domain/services/token.service";
import { AuthResponseDto, LoginDto } from "../dto/auth.dto";

export type LoginUseCaseResponse = Either<UnauthorizedError, AuthResponseDto>;

export class LoginUseCase {
  static inject = [
    PrismaUserRepository,
    BcryptHasher,
    TokenService,
    AuthTokenRepository,
  ];

  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly hasher: BcryptHasher,
    private readonly tokenService: TokenService,
    private readonly authTokenRepository: AuthTokenRepository,
  ) {}

  /**
   * Executa login por e-mail e senha.
   *
   * Passos:
   * 1. Busca usuário ativo por e-mail.
   * 2. Compara senha enviada com hash salvo.
   * 3. Gera access token curto.
   * 4. Gera refresh token aleatório.
   * 5. Salva hash do refresh token no banco.
   * 6. Retorna usuário e tokens.
   */
  async execute(input: LoginDto): Promise<LoginUseCaseResponse> {
    const user = await this.userRepository.findActiveByEmail(input.email);

    if (!user) {
      return left(
        new UnauthorizedError({
          message: "Credenciais inválidas.",
        }),
      );
    }

    const passwordMatches = await this.hasher.compare(
      input.password,
      user.passwordHash.getValue(),
    );

    if (!passwordMatches) {
      return left(
        new UnauthorizedError({
          message: "Credenciais inválidas.",
        }),
      );
    }

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);

    const expiresInDays = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + expiresInDays);

    await this.authTokenRepository.createRefreshToken({
      userId: user.id.getValue(),
      valueHash: refreshTokenHash,
      expiredAt,
    });

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  }
}
```

---

## 24. Auth Service — RefreshTokenUseCase

```ts
import { Either, left, right } from "@/common/domain/errors/handle-errors/either";
import { UnauthorizedError } from "@/common/domain/errors/usecases/unauthorized.error";
import { PrismaUserRepository } from "@/modules/users/infrastructure/database/prisma-user.repository";
import { AuthTokenRepository } from "../../domain/repositories/auth-token.repository";
import { TokenService } from "../../domain/services/token.service";
import { AuthResponseDto, RefreshTokenDto } from "../dto/auth.dto";

export type RefreshTokenUseCaseResponse = Either<
  UnauthorizedError,
  AuthResponseDto
>;

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly tokenService: TokenService,
    private readonly authTokenRepository: AuthTokenRepository,
  ) {}

  /**
   * Renova tokens a partir de um refresh token válido.
   *
   * Estratégia de segurança:
   * - Revoga o refresh token antigo.
   * - Gera um novo refresh token.
   * - Gera um novo access token.
   */
  async execute(
    input: RefreshTokenDto,
  ): Promise<RefreshTokenUseCaseResponse> {
    const refreshTokenHash = await this.tokenService.hashToken(
      input.refreshToken,
    );

    const storedToken = await this.authTokenRepository.findValidRefreshToken(
      refreshTokenHash,
    );

    if (!storedToken) {
      return left(
        new UnauthorizedError({
          message: "Refresh token inválido ou expirado.",
        }),
      );
    }

    const user = await this.userRepository.findActiveById(storedToken.userId);

    if (!user) {
      return left(
        new UnauthorizedError({
          message: "Usuário não encontrado ou inativo.",
        }),
      );
    }

    await this.authTokenRepository.revokeRefreshToken(storedToken.id);

    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const newRefreshToken = await this.tokenService.generateRefreshToken();
    const newRefreshTokenHash = await this.tokenService.hashToken(
      newRefreshToken,
    );

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    await this.authTokenRepository.createRefreshToken({
      userId: user.id.getValue(),
      valueHash: newRefreshTokenHash,
      expiredAt,
    });

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken: newRefreshToken,
    });
  }
}
```

---

## 25. Métodos necessários no UserRepository

Implemente no repositório Prisma:

```ts
/**
 * Busca usuário ativo por e-mail.
 *
 * Ativo significa:
 * - Existe no banco.
 * - deletedAt é null.
 */
async findActiveByEmail(email: string): Promise<UserEntity | null> {
  const user = await this.prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (!user) return null;

  return PrismaUserMapper.toDomain(user);
}

/**
 * Busca usuário ativo por ID.
 */
async findActiveById(id: string): Promise<UserEntity | null> {
  const user = await this.prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) return null;

  return PrismaUserMapper.toDomain(user);
}

/**
 * Marca e-mail como verificado.
 */
async markEmailAsVerified(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
    },
  });
}

/**
 * Atualiza hash de senha.
 */
async changePassword(id: string, passwordHash: string): Promise<void> {
  await this.prisma.user.update({
    where: { id },
    data: {
      passwordHash,
    },
  });
}

/**
 * Remove usuário logicamente.
 */
async softDelete(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
    },
  });
}
```

---

## 26. Rotas finais do Auth Service

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/request-otp
POST /auth/validate-otp
```

### Exemplo de controller de login no auth-service

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, Post, Validate } from "@/common/infrastructure/http/decorators";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { LoginDto } from "../../application/dto/auth.dto";
import { LoginSchema, AuthResponseSchema } from "../schemas/auth.schema";

@Controller("/auth")
export class LoginController {
  static inject = [LoginUseCase];

  constructor(private readonly loginUseCase: LoginUseCase) {}

  /**
   * Endpoint real de autenticação.
   *
   * Este controller pertence ao auth-service.
   */
  @Validate({ body: LoginSchema })
  @Post("/login", {
    tags: ["Auth"],
    summary: "Login",
    description: "Valida credenciais e retorna tokens.",
    body: LoginSchema,
    responses: {
      200: { description: "Login realizado", schema: AuthResponseSchema },
      401: { description: "Credenciais inválidas" },
    },
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginDto;
    const result = await this.loginUseCase.execute(body);

    if (result.isLeft()) {
      throw result.value;
    }

    return reply.status(200).send(result.value);
  }
}
```

---

## 27. Exemplo de chamada pelo frontend

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3333",
});

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("accessToken", response.data.accessToken);
  localStorage.setItem("refreshToken", response.data.refreshToken);

  return response.data;
}

export async function createUser(input: unknown) {
  const accessToken = localStorage.getItem("accessToken");

  const response = await api.post("/users", input, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-tenant-id": "tenant-uuid",
      "x-organization-id": "organization-uuid",
    },
  });

  return response.data;
}
```

---

## 28. Docker Compose

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app

  auth-service:
    build:
      context: .
      dockerfile: apps/auth-service/Dockerfile
    ports:
      - "3334:3334"
    environment:
      PORT: 3334
      DATABASE_URL: postgresql://app:app@postgres:5432/app
      JWT_SECRET: super-secret
      JWT_EXPIRES_IN: 15m
      REFRESH_TOKEN_EXPIRES_IN_DAYS: 7
    depends_on:
      - postgres

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "3333:3333"
    environment:
      PORT: 3333
      AUTH_SERVICE_URL: http://auth-service:3334
      JWT_SECRET: super-secret
    depends_on:
      - auth-service
```

---

## 29. Ordem de execução da implementação

### Etapa 1 — Preparar estrutura

```txt
apps/auth-service/src/modules/auth
apps/backend/src/shared/auth
apps/backend/src/shared/rbac
apps/backend/src/shared/http/clients
apps/backend/src/modules/memberships
```

### Etapa 2 — Criar enums de RBAC

```txt
roles.ts
permissions.ts
role-permissions.ts
```

### Etapa 3 — Criar client HTTP no backend

```txt
auth-service.client.ts
```

### Etapa 4 — Criar schemas e DTOs do auth-service

```txt
auth.schema.ts
auth.dto.ts
```

### Etapa 5 — Criar TokenService

```txt
token.service.ts
jwt-token.service.ts
```

### Etapa 6 — Criar AuthTokenRepository

```txt
auth-token.repository.ts
prisma-auth-token.repository.ts
```

### Etapa 7 — Implementar UserRepository faltante

```txt
findActiveByEmail
findActiveById
markEmailAsVerified
changePassword
softDelete
```

### Etapa 8 — Criar use cases

```txt
LoginUseCase
RefreshTokenUseCase
LogoutUseCase
RegisterUseCase
MeUseCase
```

### Etapa 9 — Criar controllers no auth-service

```txt
LoginController
RefreshTokenController
LogoutController
RegisterController
MeController
```

### Etapa 10 — Criar guards no backend

```txt
auth.guard.ts
can.guard.ts
```

### Etapa 11 — Proteger rotas do backend

```txt
preHandler: [authGuard, can(Permission.X)]
```

### Etapa 12 — Testar fluxo completo

```txt
1. Criar usuário
2. Criar tenant
3. Criar organization
4. Criar membership OWNER
5. Fazer login
6. Chamar rota protegida com x-tenant-id
7. Validar permissão
```

---

## 30. Checklist de segurança

- Nunca salvar senha pura.
- Nunca salvar refresh token puro.
- Access token deve expirar rápido.
- Refresh token deve ser revogável.
- Backend não deve confiar em tenant enviado sem validar membership.
- Permissões não devem ficar fixas apenas no frontend.
- Controllers não devem conter regra de permissão manual espalhada.
- Rotas sensíveis devem ter rate limit.
- Login deve retornar mensagem genérica para evitar enumeração de usuários.
- Logs não devem expor senha, token ou hash sensível.

---

## 31. Erros comuns

### Erro 1 — Colocar permissões dentro do JWT

Evite colocar todas as permissões no token, porque permissões mudam. Se uma role for alterada, o token antigo continuaria com permissões antigas até expirar.

Melhor abordagem:

```txt
JWT → identidade
Backend → autorização atual baseada em membership
```

### Erro 2 — Validar apenas role, sem tenant

Errado:

```txt
Usuário é ADMIN, então pode tudo.
```

Certo:

```txt
Usuário é ADMIN dentro do tenant X e organization Y.
```

### Erro 3 — Frontend chamar auth-service interno direto

Pode funcionar, mas em SaaS profissional o backend deve centralizar logs, tenant, auditoria, rate limit e políticas.

### Erro 4 — Salvar refresh token sem hash

Refresh token funciona como credencial. Se vazar, permite renovar sessão. Salve apenas hash.

---

## 32. Big-O dos principais métodos

| Método | Complexidade | Observação |
|---|---:|---|
| `findActiveByEmail` | O(log n) | Usa índice de e-mail. |
| `findActiveById` | O(log n) | Usa chave primária. |
| `findActiveMembership` | O(log n) | Usa índices de userId, tenantId e organizationId. |
| `permissions.includes` | O(p) | p = número de permissões da role. Pequeno na prática. |
| `rolePermissions[role]` | O(1) | Acesso direto por chave. |

---

## 33. Decisão final recomendada

Use esta divisão:

```txt
Auth Service
  - Login
  - Registro
  - Refresh token
  - Logout
  - Senha
  - OTP
  - Verificação de e-mail

Backend
  - Tenant
  - Organization
  - Membership
  - RBAC
  - Regras de negócio
  - Auditoria

Frontend
  - Formulários
  - Armazenamento dos tokens
  - Envio de Authorization Bearer
  - Envio de x-tenant-id e x-organization-id
```

Regra de ouro:

```txt
Auth Service responde: quem é o usuário?
Backend responde: o que esse usuário pode fazer neste tenant?
```
