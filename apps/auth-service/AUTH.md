# Guia TDD — Módulo Auth + Session com Redis em Monorepo

> **Stack:** TypeScript · Fastify · Zod · PostgreSQL · Prisma · Redis · Vitest
> **Padrão:** Clean Architecture · TDD (Red → Green → Refactor) · RBAC Multi-tenant
> **Modelo:** auth-service cuida de identidade · backend cuida de session e RBAC

---

## Índice

1. Visão geral da arquitetura revisada
2. Estrutura do monorepo
3. Por onde começar — ordem obrigatória
4. Setup do ambiente de testes
5. Rotas principais e documentação
6. Etapa 1 — Schemas e DTOs
7. Etapa 2 — Entidade de Session
8. Etapa 3 — SessionRepository abstrato
9. Etapa 4 — SessionCacheService (Redis)
10. Etapa 5 — Fakes para TDD
11. Etapa 6 — AuthServiceClient
12. Etapa 7 — CreateSessionUseCase
13. Etapa 8 — RevokeSessionUseCase
14. Etapa 9 — GetSessionUseCase
15. Etapa 10 — Repositório Prisma
16. Etapa 11 — Repositório Redis
17. Etapa 12 — authGuard revisado
18. Etapa 13 — RBAC Guard
19. Etapa 14 — Controllers e rotas
20. Etapa 15 — Testes de integração
21. Prisma Schema
22. Docker Compose com Redis
23. Métodos e funções documentados
24. Checklist TDD completo

---

## 1. Visão geral da arquitetura revisada

### Divisão de responsabilidades

```
auth-service (porta 3334)
  └── Identidade
       ├── Quem é o usuário?
       ├── A senha está correta?
       ├── Gera JWT de curta duração
       └── Não conhece tenant, role ou permissão

backend (porta 3333)
  └── Session + RBAC
       ├── Cria session com contexto SaaS completo
       ├── Armazena session no PostgreSQL
       ├── Cacheia session no Redis
       ├── Resolve tenant, organization, role e permissions
       └── Protege rotas com authGuard + can()
```

### Fluxo completo de login

```
Frontend
  ↓ POST /auth/login { email, password, tenantId }

Backend — LoginController
  ↓ chama auth-service → valida credenciais → recebe { userId, email }
  ↓ busca Membership ativo { userId + tenantId }
  ↓ resolve permissions via rolePermissions[role]
  ↓ cria Session no PostgreSQL
  ↓ salva Session no Redis (TTL = duração da session)
  ↓ retorna { sessionToken }

Frontend
  ↓ envia Authorization: Bearer <sessionToken> em toda requisição

Backend — authGuard
  ↓ extrai sessionToken do header
  ↓ busca no Redis (rápido, sub-ms)
    ↓ cache hit  → popula request.auth → continua
    ↓ cache miss → busca no PostgreSQL → recarrega Redis → continua
    ↓ não existe → 401
```

### Por que Redis + PostgreSQL

```
PostgreSQL  →  fonte da verdade, histórico, revogação persistente
Redis       →  cache de leitura, performance, TTL automático

Sem Redis:  toda requisição = 1 query no banco
Com Redis:  toda requisição = 1 lookup in-memory (sub-millisegundo)
```

---

## 2. Estrutura do monorepo

```
meu-projeto/
├── apps/
│   ├── auth-service/
│   │   └── src/modules/auth/ e users/
│   │
│   └── backend/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── sessions/
│       │   │   │   ├── domain/
│       │   │   │   │   ├── entities/session.entity.ts
│       │   │   │   │   ├── repositories/session.repository.ts
│       │   │   │   │   └── services/session-cache.service.ts
│       │   │   │   ├── application/
│       │   │   │   │   ├── dto/session.dto.ts
│       │   │   │   │   └── use-cases/
│       │   │   │   │       ├── create-session.use-case.ts
│       │   │   │   │       ├── get-session.use-case.ts
│       │   │   │   │       └── revoke-session.use-case.ts
│       │   │   │   └── infrastructure/
│       │   │   │       ├── database/prisma-session.repository.ts
│       │   │   │       ├── cache/redis-session-cache.service.ts
│       │   │   │       └── http/controllers/ e routes/
│       │   │   └── memberships/
│       │   └── shared/
│       │       ├── auth/auth.guard.ts
│       │       ├── rbac/can.guard.ts
│       │       └── http/clients/auth-service.client.ts
│       └── test/
│           ├── unit/
│           ├── integration/
│           └── fakes/
│
├── packages/
│   ├── common/
│   └── database/
└── pnpm-workspace.yaml
```

---

## 3. Por onde começar — ordem obrigatória

```
Etapa 1   →  Schemas Zod (login, session)
Etapa 2   →  SessionEntity (entidade de domínio)
Etapa 3   →  SessionRepository abstrato (PostgreSQL)
Etapa 4   →  SessionCacheService abstrato (Redis)
Etapa 5   →  Fakes dos dois (TDD sem infraestrutura)
Etapa 6   →  AuthServiceClient (HTTP para auth-service)
Etapa 7   →  CreateSessionUseCase (teste primeiro)
Etapa 8   →  RevokeSessionUseCase (teste primeiro)
Etapa 9   →  GetSessionUseCase (teste primeiro)
Etapa 10  →  PrismaSessionRepository
Etapa 11  →  RedisSessionCacheService
Etapa 12  →  authGuard revisado (Redis → PostgreSQL fallback)
Etapa 13  →  RBAC Guard can()
Etapa 14  →  Controllers + rotas Fastify
Etapa 15  →  Testes de integração
```

---

## 4. Setup do ambiente de testes

### Dependências

```bash
pnpm --filter backend add ioredis
pnpm --filter backend add -D vitest @vitest/coverage-v8 supertest @types/supertest ioredis-mock
```

### Variáveis de ambiente

```env
# apps/backend/.env
PORT=3333
AUTH_SERVICE_URL=http://localhost:3334
DATABASE_URL=postgresql://app:app@localhost:5432/app
REDIS_URL=redis://localhost:6379
SESSION_EXPIRES_IN_HOURS=8
JWT_SECRET=super-secret
```

---

## 5. Rotas principais e documentação

### Backend — Session (porta 3333)

| Método | Rota             | Use Case                 | Guard     | Descrição                           |
| ------ | ---------------- | ------------------------ | --------- | ----------------------------------- |
| POST   | /auth/login      | CreateSessionUseCase     | Pública   | Valida credenciais e cria session   |
| POST   | /auth/logout     | RevokeSessionUseCase     | authGuard | Revoga session atual                |
| POST   | /auth/logout-all | RevokeAllSessionsUseCase | authGuard | Revoga todas as sessions do usuário |
| GET    | /auth/me         | GetSessionUseCase        | authGuard | Retorna contexto da session atual   |
| GET    | /auth/sessions   | ListSessionsUseCase      | authGuard | Lista sessions ativas do usuário    |

### Backend — Rotas de negócio protegidas

| Método | Rota           | Guard           | Permissão         |
| ------ | -------------- | --------------- | ----------------- |
| POST   | /users         | authGuard + can | user:create       |
| GET    | /users         | authGuard + can | user:read         |
| GET    | /organizations | authGuard + can | organization:read |

---

## 6. Etapa 1 — Schemas e DTOs

**Arquivo:** `apps/backend/src/modules/sessions/infrastructure/http/schemas/session.schema.ts`

```ts
import { z } from "zod";

/**
 * CreateSessionSchema
 * Valida entrada do endpoint de login no backend.
 * tenantId é obrigatório pois o backend resolve o contexto SaaS.
 */
export const CreateSessionSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8).max(72),
  tenantId: z.string().uuid("tenantId inválido"),
  organizationId: z.string().uuid().optional(),
});

/**
 * SessionResponseSchema
 * Shape da session retornada ao frontend após login.
 */
export const SessionResponseSchema = z.object({
  sessionToken: z.string(),
  expiresAt: z.date(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  tenantId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  role: z.string(),
});
```

**Arquivo:** `apps/backend/src/modules/sessions/application/dto/session.dto.ts`

```ts
import { z } from "zod";
import {
  CreateSessionSchema,
  SessionResponseSchema,
} from "../../infrastructure/http/schemas/session.schema";

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type SessionResponseDto = z.infer<typeof SessionResponseSchema>;
```

---

## 7. Etapa 2 — Entidade de Session

**Arquivo:** `apps/backend/src/modules/sessions/domain/entities/session.entity.ts`

```ts
import { randomBytes, randomUUID } from "node:crypto";
import { Permission } from "@/shared/rbac/permissions";
import { Role } from "@/shared/rbac/roles";

export interface SessionEntityProps {
  id?: string;
  token?: string;
  userId: string;
  tenantId: string;
  organizationId?: string | null;
  role: Role;
  permissions: Permission[];
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
}

/**
 * SessionEntity
 * Representa uma sessão autenticada do usuário no contexto SaaS.
 *
 * Carrega:
 * - Identidade (userId)
 * - Contexto SaaS (tenantId, organizationId)
 * - Autorização (role, permissions)
 * - Metadados de segurança (ip, userAgent, expiresAt)
 *
 * O token é gerado automaticamente se não fornecido (32 bytes hex = 64 chars).
 */
export class SessionEntity {
  readonly id: string;
  readonly token: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly organizationId: string | null;
  readonly role: Role;
  readonly permissions: Permission[];
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: SessionEntityProps) {
    this.id = props.id ?? randomUUID();
    this.token = props.token ?? randomBytes(32).toString("hex");
    this.userId = props.userId;
    this.tenantId = props.tenantId;
    this.organizationId = props.organizationId ?? null;
    this.role = props.role;
    this.permissions = props.permissions;
    this.ipAddress = props.ipAddress ?? null;
    this.userAgent = props.userAgent ?? null;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  /**
   * isValid
   * Retorna true se a session não foi revogada e ainda não expirou.
   */
  isValid(): boolean {
    return this.revokedAt === null && this.expiresAt > new Date();
  }

  /**
   * hasPermission
   * Verifica se a session carrega uma permissão específica.
   * Comparação local sem nova query ao banco.
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }
}
```

### Teste da entidade

**Arquivo:** `apps/backend/test/unit/entities/session.entity.spec.ts`

```ts
import { describe, it, expect } from "vitest";
import { SessionEntity } from "@/modules/sessions/domain/entities/session.entity";
import { Role } from "@/shared/rbac/roles";
import { Permission } from "@/shared/rbac/permissions";

function makeSession(overrides = {}) {
  return new SessionEntity({
    userId: "user-id",
    tenantId: "tenant-id",
    role: Role.ADMIN,
    permissions: [Permission.USER_CREATE, Permission.USER_READ],
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe("SessionEntity", () => {
  it("deve gerar token de 64 chars automaticamente", () => {
    expect(makeSession().token).toHaveLength(64);
  });

  it("isValid deve retornar true para session ativa", () => {
    expect(makeSession().isValid()).toBe(true);
  });

  it("isValid deve retornar false para session revogada", () => {
    expect(makeSession({ revokedAt: new Date() }).isValid()).toBe(false);
  });

  it("isValid deve retornar false para session expirada", () => {
    expect(makeSession({ expiresAt: new Date(Date.now() - 1000) }).isValid()).toBe(false);
  });

  it("hasPermission deve retornar true para permissão existente", () => {
    expect(makeSession().hasPermission(Permission.USER_CREATE)).toBe(true);
  });

  it("hasPermission deve retornar false para permissão ausente", () => {
    expect(makeSession().hasPermission(Permission.PAYMENT_REFUND)).toBe(false);
  });
});
```

---

## 8. Etapa 3 — SessionRepository abstrato

**Arquivo:** `apps/backend/src/modules/sessions/domain/repositories/session.repository.ts`

```ts
import { SessionEntity } from "../entities/session.entity";
import { Role } from "@/shared/rbac/roles";
import { Permission } from "@/shared/rbac/permissions";

export interface CreateSessionInput {
  userId: string;
  tenantId: string;
  organizationId?: string | null;
  role: Role;
  permissions: Permission[];
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * SessionRepository
 * Contrato para persistência de sessions no PostgreSQL.
 * Redis é tratado separadamente no SessionCacheService.
 *
 * Responsabilidade:
 * - Fonte da verdade para todas as sessions.
 * - Permite revogação permanente e auditoria.
 * - Histórico de sessions por usuário.
 */
export abstract class SessionRepository {
  /**
   * create — Persiste nova session, token gerado na entidade.
   */
  abstract create(input: CreateSessionInput): Promise<SessionEntity>;

  /**
   * findByToken — Busca session válida pelo token opaco.
   * Usado como fallback quando Redis não tem a session.
   */
  abstract findByToken(token: string): Promise<SessionEntity | null>;

  /**
   * findAllActiveByUser — Lista sessions ativas do usuário.
   * Filtra revokedAt = null e expiresAt > now.
   */
  abstract findAllActiveByUser(userId: string): Promise<SessionEntity[]>;

  /**
   * revoke — Define revokedAt = now(). Mantém histórico.
   */
  abstract revoke(id: string): Promise<void>;

  /**
   * revokeAllByUser — Revoga todas as sessions ativas.
   * Usado em: troca de senha, bloqueio, logout global.
   */
  abstract revokeAllByUser(userId: string): Promise<void>;
}
```

---

## 9. Etapa 4 — SessionCacheService (Redis)

**Arquivo:** `apps/backend/src/modules/sessions/domain/services/session-cache.service.ts`

```ts
import { SessionEntity } from "../entities/session.entity";

/**
 * SessionCacheService
 * Abstração para cache de sessions no Redis.
 *
 * Não é a fonte da verdade — PostgreSQL é.
 * Redis pode ser limpo e recarregado sem perda de dados.
 *
 * TTL é calculado automaticamente a partir de expiresAt da session.
 */
export abstract class SessionCacheService {
  /**
   * set — Salva session no Redis com TTL calculado a partir de expiresAt.
   */
  abstract set(session: SessionEntity): Promise<void>;

  /**
   * get — Busca session pelo token. Retorna null em cache miss.
   */
  abstract get(token: string): Promise<SessionEntity | null>;

  /**
   * delete — Remove a session do Redis imediatamente (logout).
   */
  abstract delete(token: string): Promise<void>;

  /**
   * deleteAllByUser — Remove todas as sessions do usuário.
   * Usa padrão de chave: session:user:{userId}
   */
  abstract deleteAllByUser(userId: string): Promise<void>;
}
```

---

## 10. Etapa 5 — Fakes para TDD

**Arquivo:** `apps/backend/test/fakes/fake-session.repository.ts`

```ts
import { randomUUID } from "node:crypto";
import {
  CreateSessionInput,
  SessionRepository,
} from "@/modules/sessions/domain/repositories/session.repository";
import { SessionEntity } from "@/modules/sessions/domain/entities/session.entity";

/**
 * FakeSessionRepository
 * Implementação em memória para testes unitários.
 * Simula PostgreSQL sem banco real.
 */
export class FakeSessionRepository extends SessionRepository {
  public items: SessionEntity[] = [];

  async create(input: CreateSessionInput): Promise<SessionEntity> {
    const session = new SessionEntity({ id: randomUUID(), ...input });
    this.items.push(session);
    return session;
  }

  async findByToken(token: string): Promise<SessionEntity | null> {
    return this.items.find((s) => s.token === token && s.isValid()) ?? null;
  }

  async findAllActiveByUser(userId: string): Promise<SessionEntity[]> {
    return this.items.filter((s) => s.userId === userId && s.isValid());
  }

  async revoke(id: string): Promise<void> {
    const index = this.items.findIndex((s) => s.id === id);
    if (index !== -1) {
      const s = this.items[index];
      this.items[index] = new SessionEntity({ ...s, revokedAt: new Date() });
    }
  }

  async revokeAllByUser(userId: string): Promise<void> {
    this.items = this.items.map((s) =>
      s.userId === userId && s.isValid()
        ? new SessionEntity({ ...s, revokedAt: new Date() })
        : s,
    );
  }
}
```

**Arquivo:** `apps/backend/test/fakes/fake-session-cache.service.ts`

```ts
import { SessionCacheService } from "@/modules/sessions/domain/services/session-cache.service";
import { SessionEntity } from "@/modules/sessions/domain/entities/session.entity";

/**
 * FakeSessionCacheService
 * Simula Redis em memória. Expõe contadores para verificar chamadas nos testes.
 */
export class FakeSessionCacheService extends SessionCacheService {
  public store = new Map<string, SessionEntity>();
  public getCalls = 0;
  public setCalls = 0;
  public deleteCalls = 0;

  async set(session: SessionEntity): Promise<void> {
    this.setCalls++;
    this.store.set(session.token, session);
  }

  async get(token: string): Promise<SessionEntity | null> {
    this.getCalls++;
    const session = this.store.get(token);
    if (!session || !session.isValid()) return null;
    return session;
  }

  async delete(token: string): Promise<void> {
    this.deleteCalls++;
    this.store.delete(token);
  }

  async deleteAllByUser(userId: string): Promise<void> {
    for (const [token, session] of this.store.entries()) {
      if (session.userId === userId) this.store.delete(token);
    }
  }
}
```

**Arquivo:** `apps/backend/test/fakes/fake-auth-service.client.ts`

```ts
import {
  AuthServiceClient,
  AuthUserResponse,
  LoginInput,
} from "@/shared/http/clients/auth-service.client";

/**
 * FakeAuthServiceClient
 * Simula respostas do auth-service sem HTTP real.
 * Permite testar CreateSessionUseCase de forma isolada.
 */
export class FakeAuthServiceClient extends AuthServiceClient {
  public validUsers = new Map<string, { id: string; email: string }>();

  constructor() {
    super();
  }

  async login(input: LoginInput): Promise<AuthUserResponse> {
    const user = this.validUsers.get(input.email);
    if (!user) throw new Error("Credenciais inválidas.");
    return { id: user.id, email: user.email, emailVerified: null };
  }
}
```

---

## 11. Etapa 6 — AuthServiceClient

**Arquivo:** `apps/backend/src/shared/http/clients/auth-service.client.ts`

```ts
import axios, { AxiosInstance } from "axios";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  emailVerified: Date | null;
}

/**
 * AuthServiceClient
 * Client HTTP para comunicação com o auth-service.
 *
 * Responsabilidade:
 * - Isolar chamadas HTTP em uma única classe.
 * - Fácil de substituir por fake nos testes.
 * - Não contém regra de negócio.
 */
export class AuthServiceClient {
  protected readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.AUTH_SERVICE_URL,
      timeout: 5_000,
    });
  }

  /**
   * login
   * Envia credenciais ao auth-service e recebe identidade do usuário.
   * Lança erro HTTP se as credenciais forem inválidas.
   */
  async login(input: LoginInput): Promise<AuthUserResponse> {
    const { data } = await this.http.post<{ user: AuthUserResponse }>(
      "/auth/login",
      input,
    );
    return data.user;
  }
}
```

---

## 12. Etapa 7 — CreateSessionUseCase

### RED — teste primeiro

**Arquivo:** `apps/backend/test/unit/use-cases/create-session.use-case.spec.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { CreateSessionUseCase } from "@/modules/sessions/application/use-cases/create-session.use-case";
import { FakeSessionRepository } from "../../fakes/fake-session.repository";
import { FakeSessionCacheService } from "../../fakes/fake-session-cache.service";
import { FakeAuthServiceClient } from "../../fakes/fake-auth-service.client";
import { FakeMembershipRepository } from "../../fakes/fake-membership.repository";
import { Role } from "@/shared/rbac/roles";

describe("CreateSessionUseCase", () => {
  let fakeSessionRepo: FakeSessionRepository;
  let fakeSessionCache: FakeSessionCacheService;
  let fakeAuthClient: FakeAuthServiceClient;
  let fakeMembershipRepo: FakeMembershipRepository;
  let sut: CreateSessionUseCase;

  const userId = randomUUID();
  const tenantId = randomUUID();

  beforeEach(() => {
    fakeSessionRepo = new FakeSessionRepository();
    fakeSessionCache = new FakeSessionCacheService();
    fakeAuthClient = new FakeAuthServiceClient();
    fakeMembershipRepo = new FakeMembershipRepository();
    sut = new CreateSessionUseCase(
      fakeAuthClient,
      fakeMembershipRepo,
      fakeSessionRepo,
      fakeSessionCache,
    );

    fakeAuthClient.validUsers.set("user@example.com", {
      id: userId,
      email: "user@example.com",
    });
    fakeMembershipRepo.items.push({
      id: randomUUID(),
      userId,
      tenantId,
      organizationId: null,
      role: Role.ADMIN,
    });
  });

  it("deve criar session e retornar sessionToken de 64 chars", async () => {
    const result = await sut.execute({
      email: "user@example.com",
      password: "senha1234",
      tenantId,
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) expect(result.value.sessionToken).toHaveLength(64);
  });

  it("deve persistir session no repositório com role e tenantId corretos", async () => {
    await sut.execute({ email: "user@example.com", password: "senha1234", tenantId });
    expect(fakeSessionRepo.items[0].role).toBe(Role.ADMIN);
    expect(fakeSessionRepo.items[0].tenantId).toBe(tenantId);
  });

  it("deve salvar session no Redis após criar", async () => {
    const result = await sut.execute({
      email: "user@example.com",
      password: "senha1234",
      tenantId,
    });
    expect(fakeSessionCache.setCalls).toBe(1);
    if (result.isRight()) {
      const cached = await fakeSessionCache.get(result.value.sessionToken);
      expect(cached).not.toBeNull();
    }
  });

  it("deve retornar erro 401 para credenciais inválidas", async () => {
    const result = await sut.execute({
      email: "naoexiste@example.com",
      password: "x",
      tenantId,
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.statusCode).toBe(401);
  });

  it("deve retornar erro 403 se usuário não tiver membership no tenant", async () => {
    const result = await sut.execute({
      email: "user@example.com",
      password: "senha1234",
      tenantId: randomUUID(),
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.value.statusCode).toBe(403);
  });

  it("session deve expirar no tempo configurado via SESSION_EXPIRES_IN_HOURS", async () => {
    process.env.SESSION_EXPIRES_IN_HOURS = "8";
    await sut.execute({ email: "user@example.com", password: "senha1234", tenantId });
    const session = fakeSessionRepo.items[0];
    const hoursUntilExpiry = (session.expiresAt.getTime() - Date.now()) / 1000 / 60 / 60;
    expect(hoursUntilExpiry).toBeCloseTo(8, 0);
  });
});
```

### GREEN — implementação

**Arquivo:** `apps/backend/src/modules/sessions/application/use-cases/create-session.use-case.ts`

```ts
import { Either, left, right } from "@/common/either";
import { UnauthorizedError } from "@/common/errors/unauthorized.error";
import { ForbiddenError } from "@/common/errors/forbidden.error";
import { AuthServiceClient } from "@/shared/http/clients/auth-service.client";
import { MembershipRepository } from "@/modules/memberships/domain/repositories/membership.repository";
import { SessionRepository } from "../../domain/repositories/session.repository";
import { SessionCacheService } from "../../domain/services/session-cache.service";
import { rolePermissions } from "@/shared/rbac/role-permissions";
import { CreateSessionDto, SessionResponseDto } from "../dto/session.dto";

export type CreateSessionUseCaseResponse = Either<
  UnauthorizedError | ForbiddenError,
  SessionResponseDto
>;

/**
 * CreateSessionUseCase
 * Orquestra o fluxo completo de login no backend.
 *
 * Passos:
 * 1. Delega validação de credenciais ao auth-service.
 * 2. Busca membership ativa do usuário no tenant informado.
 * 3. Resolve permissões a partir da role da membership.
 * 4. Cria session no PostgreSQL com contexto SaaS completo.
 * 5. Salva session no Redis com TTL automático.
 * 6. Retorna sessionToken ao frontend.
 *
 * Responsabilidade:
 * - NÃO valida senha (auth-service faz isso).
 * - NÃO gera JWT (session token é opaco e aleatório).
 * - SIM resolve contexto SaaS e permissões.
 */
export class CreateSessionUseCase {
  constructor(
    private readonly authServiceClient: AuthServiceClient,
    private readonly membershipRepository: MembershipRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  async execute(
    input: CreateSessionDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<CreateSessionUseCaseResponse> {
    // 1. Valida credenciais no auth-service
    let authUser: { id: string; email: string; emailVerified: Date | null };

    try {
      authUser = await this.authServiceClient.login({
        email: input.email,
        password: input.password,
      });
    } catch {
      return left(new UnauthorizedError({ message: "Credenciais inválidas." }));
    }

    // 2. Busca membership no tenant informado
    const membership = await this.membershipRepository.findActive({
      userId: authUser.id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
    });

    if (!membership) {
      return left(new ForbiddenError({ message: "Usuário não pertence a este tenant." }));
    }

    // 3. Resolve permissões da role
    const permissions = rolePermissions[membership.role] ?? [];

    // 4. Calcula expiração
    const expiresInHours = Number(process.env.SESSION_EXPIRES_IN_HOURS ?? 8);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 5. Cria session no PostgreSQL
    const session = await this.sessionRepository.create({
      userId: authUser.id,
      tenantId: membership.tenantId,
      organizationId: membership.organizationId,
      role: membership.role,
      permissions,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // 6. Salva no Redis
    await this.sessionCacheService.set(session);

    return right({
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      user: { id: authUser.id, email: authUser.email },
      tenantId: session.tenantId,
      organizationId: session.organizationId,
      role: session.role,
    });
  }
}
```

---

## 13. Etapa 8 — RevokeSessionUseCase

### RED — teste primeiro

**Arquivo:** `apps/backend/test/unit/use-cases/revoke-session.use-case.spec.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { RevokeSessionUseCase } from "@/modules/sessions/application/use-cases/revoke-session.use-case";
import { FakeSessionRepository } from "../../fakes/fake-session.repository";
import { FakeSessionCacheService } from "../../fakes/fake-session-cache.service";
import { Role } from "@/shared/rbac/roles";

describe("RevokeSessionUseCase", () => {
  let fakeSessionRepo: FakeSessionRepository;
  let fakeSessionCache: FakeSessionCacheService;
  let sut: RevokeSessionUseCase;

  beforeEach(async () => {
    fakeSessionRepo = new FakeSessionRepository();
    fakeSessionCache = new FakeSessionCacheService();
    sut = new RevokeSessionUseCase(fakeSessionRepo, fakeSessionCache);

    const session = await fakeSessionRepo.create({
      userId: randomUUID(),
      tenantId: randomUUID(),
      role: Role.MEMBER,
      permissions: [],
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });
    await fakeSessionCache.set(session);
    (sut as any)._token = session.token;
  });

  it("deve revogar session no repositório", async () => {
    await sut.execute((sut as any)._token);
    expect(fakeSessionRepo.items[0].revokedAt).not.toBeNull();
  });

  it("deve remover session do cache Redis", async () => {
    await sut.execute((sut as any)._token);
    expect(fakeSessionCache.deleteCalls).toBe(1);
    expect(await fakeSessionCache.get((sut as any)._token)).toBeNull();
  });

  it("deve retornar erro para token inexistente", async () => {
    const result = await sut.execute("token-invalido");
    expect(result.isLeft()).toBe(true);
  });
});
```

### GREEN — implementação

**Arquivo:** `apps/backend/src/modules/sessions/application/use-cases/revoke-session.use-case.ts`

```ts
import { Either, left, right } from "@/common/either";
import { NotFoundError } from "@/common/errors/not-found.error";
import { SessionRepository } from "../../domain/repositories/session.repository";
import { SessionCacheService } from "../../domain/services/session-cache.service";

export type RevokeSessionUseCaseResponse = Either<NotFoundError, void>;

/**
 * RevokeSessionUseCase
 * Encerra uma session específica (logout simples).
 *
 * Ordem de operações (importa para consistência):
 * 1. Busca session pelo token.
 * 2. Revoga no PostgreSQL (fonte da verdade).
 * 3. Remove do Redis (invalida cache imediatamente).
 *
 * Se o Redis falhar no passo 3, o banco já está revogado.
 * Na próxima requisição, o cache miss leva ao banco, que retorna null.
 */
export class RevokeSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  async execute(token: string): Promise<RevokeSessionUseCaseResponse> {
    const session = await this.sessionRepository.findByToken(token);

    if (!session) {
      return left(new NotFoundError({ message: "Session não encontrada." }));
    }

    await this.sessionRepository.revoke(session.id);
    await this.sessionCacheService.delete(token);

    return right(undefined);
  }
}
```

---

## 14. Etapa 9 — GetSessionUseCase

**Arquivo:** `apps/backend/src/modules/sessions/application/use-cases/get-session.use-case.ts`

```ts
import { Either, left, right } from "@/common/either";
import { UnauthorizedError } from "@/common/errors/unauthorized.error";
import { SessionEntity } from "../../domain/entities/session.entity";
import { SessionRepository } from "../../domain/repositories/session.repository";
import { SessionCacheService } from "../../domain/services/session-cache.service";

export type GetSessionUseCaseResponse = Either<UnauthorizedError, SessionEntity>;

/**
 * GetSessionUseCase
 * Resolve uma session a partir do token. Usado pelo authGuard em toda requisição.
 *
 * Estratégia cache-aside:
 * 1. Busca no Redis (rápido, sub-ms).
 * 2. Cache hit → retorna diretamente (sem query ao banco).
 * 3. Cache miss → busca no PostgreSQL.
 * 4. Encontrou → recarrega Redis → retorna.
 * 5. Não encontrou ou inválida → 401.
 *
 * Sessions revogadas são removidas do Redis no RevokeSessionUseCase,
 * garantindo invalidação imediata sem esperar TTL.
 */
export class GetSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  async execute(token: string): Promise<GetSessionUseCaseResponse> {
    // 1. Tenta cache primeiro
    const cached = await this.sessionCacheService.get(token);
    if (cached) return right(cached);

    // 2. Cache miss → banco
    const session = await this.sessionRepository.findByToken(token);

    if (!session || !session.isValid()) {
      return left(new UnauthorizedError({ message: "Session inválida ou expirada." }));
    }

    // 3. Recarrega Redis
    await this.sessionCacheService.set(session);

    return right(session);
  }
}
```

### Teste do GetSessionUseCase

**Arquivo:** `apps/backend/test/unit/use-cases/get-session.use-case.spec.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { GetSessionUseCase } from "@/modules/sessions/application/use-cases/get-session.use-case";
import { FakeSessionRepository } from "../../fakes/fake-session.repository";
import { FakeSessionCacheService } from "../../fakes/fake-session-cache.service";
import { Role } from "@/shared/rbac/roles";

describe("GetSessionUseCase", () => {
  let fakeSessionRepo: FakeSessionRepository;
  let fakeSessionCache: FakeSessionCacheService;
  let sut: GetSessionUseCase;

  beforeEach(() => {
    fakeSessionRepo = new FakeSessionRepository();
    fakeSessionCache = new FakeSessionCacheService();
    sut = new GetSessionUseCase(fakeSessionRepo, fakeSessionCache);
  });

  it("deve retornar session do cache sem consultar o banco (cache hit)", async () => {
    const session = await fakeSessionRepo.create({
      userId: randomUUID(),
      tenantId: randomUUID(),
      role: Role.ADMIN,
      permissions: [],
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });
    await fakeSessionCache.set(session);

    const result = await sut.execute(session.token);

    expect(result.isRight()).toBe(true);
    // Banco não foi consultado — apenas o cache
    expect(fakeSessionCache.getCalls).toBe(1);
    expect(fakeSessionCache.setCalls).toBe(1); // set no beforeEach
  });

  it("deve buscar no banco em cache miss e recarregar Redis", async () => {
    const session = await fakeSessionRepo.create({
      userId: randomUUID(),
      tenantId: randomUUID(),
      role: Role.ADMIN,
      permissions: [],
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });

    const result = await sut.execute(session.token);

    expect(result.isRight()).toBe(true);
    // Deve ter salvo no cache após miss
    expect(fakeSessionCache.setCalls).toBe(1);
  });

  it("deve retornar erro para token inexistente", async () => {
    const result = await sut.execute("token-invalido");
    expect(result.isLeft()).toBe(true);
  });
});
```

---

## 15. Etapa 10 — Repositório Prisma

**Arquivo:** `apps/backend/src/modules/sessions/infrastructure/database/prisma-session.repository.ts`

```ts
import { PrismaClient } from "@prisma/client";
import {
  CreateSessionInput,
  SessionRepository,
} from "../../domain/repositories/session.repository";
import { SessionEntity } from "../../domain/entities/session.entity";
import { Role } from "@/shared/rbac/roles";
import { Permission } from "@/shared/rbac/permissions";

/**
 * PrismaSessionRepository
 * Implementação concreta do SessionRepository usando Prisma + PostgreSQL.
 * Fonte da verdade para todas as sessions.
 */
export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async create(input: CreateSessionInput): Promise<SessionEntity> {
    const entity = new SessionEntity(input);

    await this.prisma.session.create({
      data: {
        id: entity.id,
        token: entity.token,
        userId: entity.userId,
        tenantId: entity.tenantId,
        organizationId: entity.organizationId,
        role: entity.role,
        permissions: entity.permissions,
        expiresAt: entity.expiresAt,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
      },
    });

    return entity;
  }

  /**
   * findByToken
   * Filtra revokedAt = null e expiresAt > now no banco.
   * Evita trazer registros inválidos para deserializar.
   */
  async findByToken(token: string): Promise<SessionEntity | null> {
    const record = await this.prisma.session.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!record) return null;

    return new SessionEntity({
      id: record.id,
      token: record.token,
      userId: record.userId,
      tenantId: record.tenantId,
      organizationId: record.organizationId,
      role: record.role as Role,
      permissions: record.permissions as Permission[],
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
    });
  }

  async findAllActiveByUser(userId: string): Promise<SessionEntity[]> {
    const records = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return records.map(
      (r) =>
        new SessionEntity({
          id: r.id,
          token: r.token,
          userId: r.userId,
          tenantId: r.tenantId,
          organizationId: r.organizationId,
          role: r.role as Role,
          permissions: r.permissions as Permission[],
          expiresAt: r.expiresAt,
          revokedAt: r.revokedAt,
          createdAt: r.createdAt,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
        }),
    );
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
```

---

## 16. Etapa 11 — Repositório Redis

**Arquivo:** `apps/backend/src/modules/sessions/infrastructure/cache/redis-session-cache.service.ts`

```ts
import { Redis } from "ioredis";
import { SessionCacheService } from "../../domain/services/session-cache.service";
import { SessionEntity } from "../../domain/entities/session.entity";
import { Role } from "@/shared/rbac/roles";
import { Permission } from "@/shared/rbac/permissions";

/**
 * RedisSessionCacheService
 * Implementação do SessionCacheService usando Redis via ioredis.
 *
 * Estratégia de chaves:
 * - session:token:{token}  → dados completos da session (JSON)
 * - session:user:{userId}  → set com tokens do usuário (para deleteAllByUser)
 *
 * TTL calculado como (expiresAt - now) em segundos.
 * Redis expira automaticamente sem precisar de job de limpeza.
 */
export class RedisSessionCacheService extends SessionCacheService {
  constructor(private readonly redis: Redis) {
    super();
  }

  private tokenKey = (token: string) => `session:token:${token}`;
  private userKey = (userId: string) => `session:user:${userId}`;

  /**
   * set
   * Serializa a session em JSON e salva com TTL calculado.
   * Registra o token no set do usuário para deleteAllByUser.
   */
  async set(session: SessionEntity): Promise<void> {
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttl <= 0) return; // Não cacheia session já expirada

    const payload = JSON.stringify({
      id: session.id,
      token: session.token,
      userId: session.userId,
      tenantId: session.tenantId,
      organizationId: session.organizationId,
      role: session.role,
      permissions: session.permissions,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    await this.redis.set(this.tokenKey(session.token), payload, "EX", ttl);
    await this.redis.sadd(this.userKey(session.userId), session.token);
    await this.redis.expire(this.userKey(session.userId), ttl);
  }

  /**
   * get
   * Deserializa session do Redis.
   * Retorna null se não existir (TTL expirou ou nunca foi cacheada).
   */
  async get(token: string): Promise<SessionEntity | null> {
    const raw = await this.redis.get(this.tokenKey(token));
    if (!raw) return null;

    const d = JSON.parse(raw);
    return new SessionEntity({
      id: d.id,
      token: d.token,
      userId: d.userId,
      tenantId: d.tenantId,
      organizationId: d.organizationId,
      role: d.role as Role,
      permissions: d.permissions as Permission[],
      expiresAt: new Date(d.expiresAt),
      createdAt: new Date(d.createdAt),
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
    });
  }

  /**
   * delete
   * Remove a session do Redis antes do TTL expirar.
   * Chamado no logout para invalidação imediata.
   */
  async delete(token: string): Promise<void> {
    await this.redis.del(this.tokenKey(token));
  }

  /**
   * deleteAllByUser
   * Remove todas as sessions do usuário usando o set de tokens registrados.
   */
  async deleteAllByUser(userId: string): Promise<void> {
    const tokens = await this.redis.smembers(this.userKey(userId));
    if (tokens.length > 0) {
      await this.redis.del(...tokens.map(this.tokenKey));
    }
    await this.redis.del(this.userKey(userId));
  }
}
```

---

## 17. Etapa 12 — authGuard revisado

**Arquivo:** `apps/backend/src/shared/auth/auth.guard.ts`

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { GetSessionUseCase } from "@/modules/sessions/application/use-cases/get-session.use-case";

/**
 * makeAuthGuard
 * Factory que retorna o authGuard com injeção do GetSessionUseCase.
 *
 * Fluxo:
 * 1. Extrai Bearer token do header Authorization.
 * 2. Chama GetSessionUseCase (Redis → PostgreSQL fallback).
 * 3. Session válida → popula request.auth com contexto completo.
 * 4. Session inválida → 401.
 *
 * Diferença do modelo anterior (JWT):
 * - Não decodifica JWT — valida token opaco no banco/cache.
 * - Revogação funciona instantaneamente (sem esperar JWT expirar).
 * - request.auth carrega permissões sem nova query ao banco.
 */
export function makeAuthGuard(getSessionUseCase: GetSessionUseCase) {
  return async function authGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return reply.status(401).send({ message: "Token de autenticação não informado." });
    }

    const token = authorization.split(" ")[1];
    const result = await getSessionUseCase.execute(token);

    if (result.isLeft()) {
      return reply.status(401).send({ message: result.value.message });
    }

    const session = result.value;

    request.auth = {
      sessionId: session.id,
      userId: session.userId,
      tenantId: session.tenantId,
      organizationId: session.organizationId,
      role: session.role,
      permissions: session.permissions,
    };
  };
}
```

**Arquivo:** `apps/backend/src/@types/fastify.d.ts`

```ts
import "fastify";
import { Permission } from "../shared/rbac/permissions";
import { Role } from "../shared/rbac/roles";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      sessionId: string;
      userId: string;
      tenantId: string;
      organizationId: string | null;
      role: Role;
      permissions: Permission[];
    };
  }
}
```

---

## 18. Etapa 13 — RBAC Guard

**Arquivo:** `apps/backend/src/shared/rbac/can.guard.ts`

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { Permission } from "./permissions";

/**
 * can
 * Factory que retorna guard de permissão baseado na session.
 *
 * Vantagem sobre o modelo anterior:
 * - NÃO consulta o banco para buscar membership.
 * - As permissions já estão na session (carregadas no login).
 * - Comparação é local e instantânea.
 *
 * Isso elimina uma query por requisição protegida.
 *
 * Uso:
 *   preHandler: [authGuard, can(Permission.USER_CREATE)]
 */
export function can(requiredPermission: Permission) {
  return async function rbacGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const auth = request.auth;

    if (!auth) {
      return reply.status(401).send({ message: "Não autenticado." });
    }

    if (!auth.permissions.includes(requiredPermission)) {
      return reply.status(403).send({
        message: "Você não possui permissão para executar esta ação.",
      });
    }
  };
}
```

---

## 19. Etapa 14 — Controllers e rotas

**Arquivo:** `apps/backend/src/modules/sessions/infrastructure/http/controllers/create-session.controller.ts`

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import { CreateSessionUseCase } from "../../../application/use-cases/create-session.use-case";
import { CreateSessionDto } from "../../../application/dto/session.dto";

/**
 * CreateSessionController
 * Recebe login, extrai IP e UserAgent, delega ao CreateSessionUseCase.
 *
 * Método: POST /auth/login
 * Body: CreateSessionSchema
 * Resposta 200: { sessionToken, expiresAt, user, tenantId, role }
 * Resposta 401: credenciais inválidas
 * Resposta 403: usuário sem membership no tenant
 */
export class CreateSessionController {
  constructor(private readonly createSessionUseCase: CreateSessionUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateSessionDto;

    const result = await this.createSessionUseCase.execute(body, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"],
    });

    if (result.isLeft()) {
      const status = result.value.constructor.name === "ForbiddenError" ? 403 : 401;
      return reply.status(status).send({ message: result.value.message });
    }

    return reply.status(200).send(result.value);
  }
}
```

**Arquivo:** `apps/backend/src/modules/sessions/infrastructure/http/routes/session.routes.ts`

```ts
import { FastifyInstance } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import { CreateSessionSchema, SessionResponseSchema } from "../schemas/session.schema";
import { makeAuthGuard } from "@/shared/auth/auth.guard";

export async function sessionRoutes(
  app: FastifyInstance,
  controllers: any,
  authGuard: ReturnType<typeof makeAuthGuard>,
) {
  // POST /auth/login — pública
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login — cria session SaaS",
        body: zodToJsonSchema(CreateSessionSchema),
        response: {
          200: zodToJsonSchema(SessionResponseSchema),
          401: { description: "Credenciais inválidas" },
          403: { description: "Usuário não pertence ao tenant" },
        },
      },
    },
    controllers.createSession.handle.bind(controllers.createSession),
  );

  // POST /auth/logout — requer authGuard
  app.post(
    "/auth/logout",
    {
      schema: { tags: ["Auth"], summary: "Logout — revoga session atual" },
      preHandler: [authGuard],
    },
    controllers.revokeSession.handle.bind(controllers.revokeSession),
  );

  // GET /auth/me — requer authGuard
  app.get(
    "/auth/me",
    {
      schema: { tags: ["Auth"], summary: "Retorna contexto da session atual" },
      preHandler: [authGuard],
    },
    controllers.getSession.handle.bind(controllers.getSession),
  );
}
```

---

## 20. Etapa 15 — Testes de integração

**Arquivo:** `apps/backend/test/integration/session.routes.spec.ts`

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/common/infrastructure/db/prisma-client";

describe("Session Routes — Integração", () => {
  let app: FastifyInstance;
  const tenantId = "tenant-id-fixo-para-testes";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
  });

  describe("POST /auth/login", () => {
    it("deve retornar 200 com sessionToken de 64 chars", async () => {
      const res = await request(app.server)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "senha1234", tenantId });
      expect(res.status).toBe(200);
      expect(res.body.sessionToken).toHaveLength(64);
      expect(res.body).toHaveProperty("expiresAt");
      expect(res.body).toHaveProperty("role");
      expect(res.body).toHaveProperty("permissions");
    });

    it("deve retornar 401 para credenciais inválidas", async () => {
      const res = await request(app.server)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "errada", tenantId });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Credenciais inválidas.");
    });

    it("deve retornar 403 para usuário sem membership no tenant", async () => {
      const res = await request(app.server).post("/auth/login").send({
        email: "user@example.com",
        password: "senha1234",
        tenantId: "outro-tenant-id",
      });
      expect(res.status).toBe(403);
    });

    it("deve retornar 422 para tenantId malformado (validação Zod)", async () => {
      const res = await request(app.server)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "senha1234", tenantId: "nao-uuid" });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /auth/me", () => {
    let sessionToken: string;

    beforeEach(async () => {
      const res = await request(app.server)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "senha1234", tenantId });
      sessionToken = res.body.sessionToken;
    });

    it("deve retornar contexto completo da session", async () => {
      const res = await request(app.server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${sessionToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("userId");
      expect(res.body).toHaveProperty("tenantId");
      expect(res.body).toHaveProperty("role");
      expect(res.body).toHaveProperty("permissions");
    });

    it("deve retornar 401 sem token", async () => {
      expect((await request(app.server).get("/auth/me")).status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    let sessionToken: string;

    beforeEach(async () => {
      const res = await request(app.server)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "senha1234", tenantId });
      sessionToken = res.body.sessionToken;
    });

    it("deve revogar session e retornar 204", async () => {
      const res = await request(app.server)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${sessionToken}`);
      expect(res.status).toBe(204);
    });

    it("token revogado não deve funcionar após logout", async () => {
      await request(app.server)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${sessionToken}`);
      const res = await request(app.server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${sessionToken}`);
      expect(res.status).toBe(401);
    });
  });
});
```

---

## 21. Prisma Schema

**Arquivo:** `packages/database/prisma/schema.prisma`

```prisma
model Session {
  id             String    @id @default(uuid())
  token          String    @unique
  userId         String
  tenantId       String
  organizationId String?
  role           String
  permissions    String[]
  ipAddress      String?
  userAgent      String?
  expiresAt      DateTime
  revokedAt      DateTime?
  createdAt      DateTime  @default(now())

  @@index([token])
  @@index([userId])
  @@index([userId, tenantId])
  @@map("sessions")
}
```

---

## 22. Docker Compose com Redis

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

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

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
      DATABASE_URL: postgresql://app:app@postgres:5432/app
      REDIS_URL: redis://redis:6379
      SESSION_EXPIRES_IN_HOURS: 8
    depends_on:
      - postgres
      - redis
      - auth-service
```

---

## 23. Métodos e funções documentados

### SessionEntity

| Método           | Retorno       | Responsabilidade                                      |
| ---------------- | ------------- | ----------------------------------------------------- |
| constructor      | SessionEntity | Gera token (32 bytes hex) e ID (UUID) automaticamente |
| isValid()        | boolean       | True se revokedAt = null e expiresAt > now            |
| hasPermission(p) | boolean       | Verifica permissão localmente sem query               |

### SessionRepository

| Método                      | Retorno                       | Responsabilidade                        |
| --------------------------- | ----------------------------- | --------------------------------------- |
| create(input)               | Promise SessionEntity         | Persiste session no PostgreSQL          |
| findByToken(token)          | Promise SessionEntity ou null | Busca session válida (fonte da verdade) |
| findAllActiveByUser(userId) | Promise SessionEntity[]       | Lista sessions ativas                   |
| revoke(id)                  | Promise void                  | Define revokedAt = now()                |
| revokeAllByUser(userId)     | Promise void                  | Logout global                           |

### SessionCacheService

| Método                  | Retorno                       | Responsabilidade                    |
| ----------------------- | ----------------------------- | ----------------------------------- |
| set(session)            | Promise void                  | Salva no Redis com TTL automático   |
| get(token)              | Promise SessionEntity ou null | Leitura sub-millisegundo            |
| delete(token)           | Promise void                  | Invalidação imediata no logout      |
| deleteAllByUser(userId) | Promise void                  | Remove todas as sessions do usuário |

### Use Cases

| Use Case             | Input            | Output                                                           | Responsabilidade                               |
| -------------------- | ---------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| CreateSessionUseCase | CreateSessionDto | Either UnauthorizedError ou ForbiddenError ou SessionResponseDto | Valida credenciais, resolve RBAC, cria session |
| RevokeSessionUseCase | token string     | Either NotFoundError ou void                                     | Revoga no banco e remove do Redis              |
| GetSessionUseCase    | token string     | Either UnauthorizedError ou SessionEntity                        | Cache-aside: Redis então PostgreSQL            |

### Guards

| Guard                            | Tipo                        | Responsabilidade                                   |
| -------------------------------- | --------------------------- | -------------------------------------------------- |
| makeAuthGuard(getSessionUseCase) | Factory → FastifyPreHandler | Valida session e popula request.auth               |
| can(permission)                  | Factory → FastifyPreHandler | Verifica permissão na session (sem query ao banco) |

---

## 24. Checklist TDD completo

```
─── Schemas e DTOs ──────────────────────────────────────────────────────────
[ ] Teste de CreateSessionSchema (tenantId UUID inválido, senha curta)
[ ] Implementar schemas e DTOs

─── SessionEntity ────────────────────────────────────────────────────────────
[ ] RED: token gerado com 64 chars
[ ] RED: isValid com session ativa
[ ] RED: isValid com revokedAt preenchido
[ ] RED: isValid com expiresAt no passado
[ ] RED: hasPermission retorna true/false
[ ] GREEN: implementar SessionEntity

─── Abstrações ──────────────────────────────────────────────────────────────
[ ] Definir SessionRepository abstrato
[ ] Definir SessionCacheService abstrato

─── Fakes ───────────────────────────────────────────────────────────────────
[ ] Implementar FakeSessionRepository
[ ] Implementar FakeSessionCacheService (com contadores de chamadas)
[ ] Implementar FakeAuthServiceClient
[ ] Implementar FakeMembershipRepository

─── AuthServiceClient ────────────────────────────────────────────────────────
[ ] Implementar AuthServiceClient com método login

─── CreateSessionUseCase ─────────────────────────────────────────────────────
[ ] RED: sessionToken com 64 chars
[ ] RED: persistir session com role e tenantId corretos
[ ] RED: salvar no Redis após criar
[ ] RED: 401 para credenciais inválidas
[ ] RED: 403 para usuário sem membership
[ ] RED: session expira no tempo configurado
[ ] GREEN: implementar CreateSessionUseCase
[ ] REFACTOR

─── RevokeSessionUseCase ─────────────────────────────────────────────────────
[ ] RED: revogar no repositório
[ ] RED: remover do Redis
[ ] RED: erro para token inexistente
[ ] GREEN: implementar RevokeSessionUseCase
[ ] REFACTOR

─── GetSessionUseCase ────────────────────────────────────────────────────────
[ ] RED: retornar do cache sem consultar banco (cache hit)
[ ] RED: buscar no banco em cache miss e recarregar Redis
[ ] RED: erro para token inexistente
[ ] GREEN: implementar GetSessionUseCase
[ ] REFACTOR

─── Infraestrutura ───────────────────────────────────────────────────────────
[ ] Implementar PrismaSessionRepository
[ ] Implementar RedisSessionCacheService
[ ] Adicionar model Session no schema Prisma
[ ] Rodar migration

─── Guards ───────────────────────────────────────────────────────────────────
[ ] Implementar makeAuthGuard com injeção de GetSessionUseCase
[ ] Implementar can() sem query ao banco
[ ] Testar authGuard via integração (com/sem token)
[ ] Testar can() via integração (com/sem permissão)

─── Controllers e Rotas ──────────────────────────────────────────────────────
[ ] Implementar CreateSessionController (extrai IP e UserAgent)
[ ] Implementar RevokeSessionController
[ ] Implementar GetSessionController
[ ] Registrar sessionRoutes no app.ts

─── Testes de integração ────────────────────────────────────────────────────
[ ] POST /auth/login retorna 200 com sessionToken
[ ] POST /auth/login retorna 401 para credenciais inválidas
[ ] POST /auth/login retorna 403 para usuário sem membership
[ ] POST /auth/login retorna 422 para tenantId malformado
[ ] GET /auth/me retorna contexto completo
[ ] GET /auth/me retorna 401 sem token
[ ] POST /auth/logout retorna 204
[ ] Token revogado não funciona após logout

─── Docker ───────────────────────────────────────────────────────────────────
[ ] Configurar Redis no Docker Compose
[ ] Conectar backend ao Redis via REDIS_URL
[ ] Testar startup completo com pnpm dev
```
