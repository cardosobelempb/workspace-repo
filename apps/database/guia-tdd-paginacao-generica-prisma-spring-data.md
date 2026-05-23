# Guia TDD — Paginação Genérica estilo Spring Data com Prisma e TypeScript

## Objetivo

Este guia mostra como implementar uma paginação profissional em TypeScript seguindo um contrato semelhante ao `Page<T>` do Spring Data, usando:

- Clean Architecture
- TDD
- Prisma ORM
- Paginação genérica
- Filtros desacoplados do Prisma
- Sort no formato `campo,direcao`
- Mapper genérico de página
- Repository base reutilizável
- Correção do erro de overload do `$transaction`

---

## 1. Estrutura recomendada

```txt
src/
├── common/
│   ├── domain/
│   │   └── pagination/
│   │       ├── pagination.types.ts
│   │       ├── filter.types.ts
│   │       ├── page-request.ts
│   │       └── sort-parser.ts
│   │
│   ├── application/
│   │   └── mappers/
│   │       └── page.mapper.ts
│   │
│   └── infrastructure/
│       └── database/
│           ├── prisma-query-builder.ts
│           ├── prisma-page.repository.ts
│           └── prisma-repository.ts
│
└── modules/
    └── identity/
        └── user/
            ├── domain/
            │   ├── entities/
            │   │   └── user.entity.ts
            │   └── repositories/
            │       └── user-page.repository.ts
            │
            └── infrastructure/
                ├── database/
                │   └── prisma-user-page.repository.ts
                └── mappers/
                    └── prisma-user.mapper.ts
```

---

## 2. Ciclo TDD

Sempre implemente nesta ordem:

```txt
1. RED
   Crie o teste falhando.

2. GREEN
   Implemente o mínimo para passar.

3. REFACTOR
   Melhore o código sem quebrar os testes.
```

Ordem recomendada:

```txt
1. pagination.types.ts
2. filter.types.ts
3. sort-parser.ts
4. page.mapper.ts
5. prisma-query-builder.ts
6. prisma-page.repository.ts
7. prisma-user-page.repository.ts
8. testes unitários
9. testes de integração
```

---

## 3. Tipos de paginação estilo Spring Data

```ts
// common/domain/pagination/pagination.types.ts

export interface Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface Pageable {
  sort: Sort;
  offset: number;
  pageSize: number;
  pageNumber: number;
  paged: boolean;
  unpaged: boolean;
}

export interface Page<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
```

---

## 4. Entrada de paginação

```ts
// common/domain/pagination/page-request.ts

import { SearchFilter } from "./filter.types";

export interface PageInput {
  /**
   * Zero-based, igual Spring Boot.
   *
   * page=0 representa a primeira página.
   */
  page?: number;

  /**
   * Quantidade de itens por página.
   *
   * No Spring Boot o padrão comum é size=20.
   */
  size?: number;

  /**
   * Formato:
   *
   * sort=createdAt,desc
   * sort=email,asc
   */
  sort?: string;

  /**
   * Filtro textual livre.
   */
  filter?: string;

  /**
   * Filtros avançados.
   */
  filters?: SearchFilter[];
}
```

---

## 5. Filtros desacoplados do Prisma

```ts
// common/domain/pagination/filter.types.ts

export type FilterOperator =
  | "eq"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}
```

---

## 6. Parser de sort

```ts
// common/domain/pagination/sort-parser.ts

export interface ParsedSort {
  field: string;
  direction: "asc" | "desc";
}

export class SortParser {
  static parse(sort?: string): ParsedSort | null {
    if (!sort) return null;

    const [field, direction] = sort.split(",");

    if (!field?.trim()) return null;

    return {
      field: field.trim(),
      direction: direction?.toLowerCase() === "asc" ? "asc" : "desc",
    };
  }
}
```

---

## 7. PageMapper genérico

```ts
// common/application/mappers/page.mapper.ts

import { Page } from "../../domain/pagination/pagination.types";

interface ToPageInput<TData, TResult> {
  data: TData[];
  total: number;
  page: number;
  size: number;
  mapper: (item: TData) => TResult;
  sorted?: boolean;
}

export class PageMapper {
  static toPage<TData, TResult>({
    data,
    total,
    page,
    size,
    mapper,
    sorted = false,
  }: ToPageInput<TData, TResult>): Page<TResult> {
    const offset = page * size;
    const totalPages = Math.ceil(total / size);

    return {
      content: data.map(mapper),

      pageable: {
        offset,
        pageNumber: page,
        pageSize: size,
        paged: true,
        unpaged: false,
        sort: {
          sorted,
          unsorted: !sorted,
          empty: !sorted,
        },
      },

      totalPages,
      totalElements: total,
      last: totalPages === 0 || page >= totalPages - 1,
      size,
      number: page,
      sort: {
        sorted,
        unsorted: !sorted,
        empty: !sorted,
      },
      numberOfElements: data.length,
      first: page === 0,
      empty: data.length === 0,
    };
  }
}
```

---

## 8. PrismaQueryBuilder

```ts
// common/infrastructure/database/prisma-query-builder.ts

import { SearchFilter } from "../../domain/pagination/filter.types";

export class PrismaQueryBuilder {
  static buildWhere(filters?: SearchFilter[]) {
    if (!filters?.length) return {};

    return {
      AND: filters.map((filter) => this.parseFilter(filter)),
    };
  }

  private static parseFilter(filter: SearchFilter) {
    switch (filter.operator) {
      case "eq":
        return {
          [filter.field]: filter.value,
        };

      case "contains":
        return {
          [filter.field]: {
            contains: filter.value,
            mode: "insensitive",
          },
        };

      case "startsWith":
        return {
          [filter.field]: {
            startsWith: filter.value,
            mode: "insensitive",
          },
        };

      case "endsWith":
        return {
          [filter.field]: {
            endsWith: filter.value,
            mode: "insensitive",
          },
        };

      case "gt":
        return {
          [filter.field]: {
            gt: filter.value,
          },
        };

      case "gte":
        return {
          [filter.field]: {
            gte: filter.value,
          },
        };

      case "lt":
        return {
          [filter.field]: {
            lt: filter.value,
          },
        };

      case "lte":
        return {
          [filter.field]: {
            lte: filter.value,
          },
        };

      case "in":
        return {
          [filter.field]: {
            in: filter.value,
          },
        };

      default:
        return {};
    }
  }
}
```

---

## 9. Repository base genérico

Atenção: não use `$transaction([...])` neste caso porque o delegate genérico retorna `Promise`, e o Prisma espera `PrismaPromise`.

Também evite usar `unknown` em `where` e `orderBy`, porque o delegate real do Prisma espera tipos específicos, como:

```ts
Prisma.UserWhereInput
Prisma.UserOrderByWithRelationInput
```

Por isso, a base deve receber `TWhere` e `TOrderBy` por genérico.

```ts
// common/infrastructure/database/prisma-page.repository.ts

import { PageMapper } from "../../application/mappers/page.mapper";
import { PageInput } from "../../domain/pagination/page-request";
import { Page } from "../../domain/pagination/pagination.types";
import { SortParser } from "../../domain/pagination/sort-parser";
import { PrismaDatabase } from "./prisma-repository";

interface Delegate<TModel, TWhere, TOrderBy> {
  count(args: { where?: TWhere }): Promise<number>;

  findMany(args: {
    where?: TWhere;
    orderBy?: TOrderBy;
    skip?: number;
    take?: number;
  }): Promise<TModel[]>;
}

interface PaginateInput<TModel, TResult, TWhere, TOrderBy> {
  params: PageInput;
  delegate: Delegate<TModel, TWhere, TOrderBy>;
  mapper: (model: TModel) => TResult;
  allowedSortFields: string[];
  defaultSortField: string;
  buildWhere?: (params: PageInput) => TWhere;
}

export abstract class PrismaPageRepository {
  constructor(protected readonly prisma: PrismaDatabase) {}

  protected async paginate<TModel, TResult, TWhere, TOrderBy>({
    params,
    delegate,
    mapper,
    allowedSortFields,
    defaultSortField,
    buildWhere,
  }: PaginateInput<TModel, TResult, TWhere, TOrderBy>): Promise<Page<TResult>> {
    const page = Math.max(params.page ?? 0, 0);
    const size = Math.max(params.size ?? 20, 1);

    const parsedSort = SortParser.parse(params.sort);

    const sortField =
      parsedSort?.field && allowedSortFields.includes(parsedSort.field)
        ? parsedSort.field
        : defaultSortField;

    const direction = parsedSort?.direction ?? "desc";

    const where = buildWhere?.(params);

    const orderBy = {
      [sortField]: direction,
    } as TOrderBy;

    const skip = page * size;

    const [total, data] = await this.prisma.$transaction(async () => {
      const total = await delegate.count({ where });

      const data = await delegate.findMany({
        where,
        orderBy,
        skip,
        take: size,
      });

      return [total, data] as const;
    });

    return PageMapper.toPage({
      data,
      total,
      page,
      size,
      mapper,
      sorted: Boolean(orderBy),
    });
  }
}
```

---

## 10. Repository de User

```ts
// modules/identity/user/infrastructure/database/prisma-user-page.repository.ts

import { Page, PageInput, TOKENS } from "@repo/common";
import { Prisma, PrismaDatabase, PrismaPageRepository } from "@repo/database";

import { UserEntity } from "../../domain/entities/user.entity";
import { UserPageRepository } from "../../domain/repositories/user-page.repository";
import { PrismaUserMapper } from "../mappers/prisma-user.mapper";

type PrismaUserModel = Prisma.UserGetPayload<object>;

export class PrismaUserPageRepository
  extends PrismaPageRepository
  implements UserPageRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  page(params: PageInput): Promise<Page<UserEntity>> {
    return this.paginate<
      PrismaUserModel,
      UserEntity,
      Prisma.UserWhereInput,
      Prisma.UserOrderByWithRelationInput
    >({
      params,
      delegate: this.prisma.user,
      mapper: PrismaUserMapper.toDomain,
      allowedSortFields: ["email", "createdAt", "updatedAt"],
      defaultSortField: "createdAt",
      buildWhere: this.buildWhere,
    });
  }

  private buildWhere(params: PageInput): Prisma.UserWhereInput {
    const filter = params.filter?.trim();

    if (!filter) return {};

    return {
      OR: [
        {
          email: {
            contains: filter,
            mode: "insensitive",
          },
        },
      ],
    };
  }
}
```

### Por que usar `buildWhere` no repository específico?

O `PrismaPageRepository` sabe paginar, ordenar e montar o formato `Page<T>`.

O `PrismaUserPageRepository` sabe quais campos de `User` podem ser filtrados.

Essa separação evita que a base genérica conheça detalhes de domínio.

---

## 11. Contrato do UserPageRepository

```ts
// modules/identity/user/domain/repositories/user-page.repository.ts

import { Page, PageInput } from "@repo/common";
import { UserEntity } from "../entities/user.entity";

export abstract class UserPageRepository {
  abstract page(params: PageInput): Promise<Page<UserEntity>>;
}
```

---

## 12. Exemplo de uso

### 12.1 Uso direto no repository

```ts
const result = await userPageRepository.page({
  page: 0,
  size: 10,
  sort: "createdAt,desc",
  filter: "gmail",
});
```

### 12.2 Equivalente HTTP

```txt
GET /users?page=0&size=10&sort=createdAt,desc&filter=gmail
```

### 12.3 Exemplo no Use Case

```ts
// modules/identity/user/application/use-cases/page-users.use-case.ts

import { Page, PageInput } from "@repo/common";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserPageRepository } from "../../domain/repositories/user-page.repository";

export class PageUsersUseCase {
  static inject = [UserPageRepository];

  constructor(private readonly userPageRepository: UserPageRepository) {}

  async execute(input: PageInput): Promise<Page<UserEntity>> {
    return this.userPageRepository.page(input);
  }
}
```

### 12.4 Exemplo no Controller Fastify

```ts
// modules/identity/user/infrastructure/http/controllers/user-page.controller.ts

import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, Get } from "@/common/infrastructure/http/decorators";
import { PageInput } from "@repo/common";
import { PageUsersUseCase } from "../../../application/use-cases/page-users.use-case";

@Controller("/users")
export class UserPageController {
  static inject = [PageUsersUseCase];

  constructor(private readonly pageUsersUseCase: PageUsersUseCase) {}

  @Get("/", {
    tags: ["User"],
    summary: "Lista usuários paginados",
    description: "Retorna usuários no formato Spring Data Page.",
  })
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      size?: string;
      sort?: string;
      filter?: string;
    };

    const input: PageInput = {
      page: query.page ? Number(query.page) : 0,
      size: query.size ? Number(query.size) : 20,
      sort: query.sort,
      filter: query.filter,
    };

    const result = await this.pageUsersUseCase.execute(input);

    return reply.status(200).send(result);
  }
}
```

### 12.5 Saída esperada

```json
{
  "content": [
    {
      "id": "2c6f8f3a-9a63-4df8-bc2e-54c5a1a3b901",
      "email": "admin@gmail.com",
      "emailVerified": null,
      "createdAt": "2026-05-23T10:20:30.000Z"
    },
    {
      "id": "984d39f0-85b2-4d4a-a851-6e983a6c20fd",
      "email": "suporte@gmail.com",
      "emailVerified": "2026-05-20T09:10:00.000Z",
      "createdAt": "2026-05-22T14:15:10.000Z"
    }
  ],
  "pageable": {
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "pageSize": 10,
    "pageNumber": 0,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 1,
  "totalElements": 2,
  "last": true,
  "size": 10,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "numberOfElements": 2,
  "first": true,
  "empty": false
}
```

### 12.6 Exemplo com sort inválido

Requisição:

```txt
GET /users?page=0&size=10&sort=passwordHash,asc&filter=gmail
```

Como `passwordHash` não está em `allowedSortFields`, o repository ignora esse campo e usa:

```ts
defaultSortField: "createdAt"
```

Isso protege o sistema contra ordenação em campos sensíveis.

---

## 13. Testes unitários

### 13.1 SortParser

```ts
import { describe, expect, it } from "vitest";
import { SortParser } from "./sort-parser";

describe("SortParser", () => {
  it("deve converter sort createdAt,desc", () => {
    const result = SortParser.parse("createdAt,desc");

    expect(result).toEqual({
      field: "createdAt",
      direction: "desc",
    });
  });

  it("deve assumir desc quando direção for inválida", () => {
    const result = SortParser.parse("createdAt,invalid");

    expect(result).toEqual({
      field: "createdAt",
      direction: "desc",
    });
  });

  it("deve retornar null quando sort estiver vazio", () => {
    expect(SortParser.parse()).toBeNull();
  });
});
```

### 13.2 PrismaQueryBuilder

```ts
import { describe, expect, it } from "vitest";
import { PrismaQueryBuilder } from "./prisma-query-builder";

describe("PrismaQueryBuilder", () => {
  it("deve montar filtro contains insensitive", () => {
    const where = PrismaQueryBuilder.buildWhere([
      {
        field: "email",
        operator: "contains",
        value: "gmail",
      },
    ]);

    expect(where).toEqual({
      AND: [
        {
          email: {
            contains: "gmail",
            mode: "insensitive",
          },
        },
      ],
    });
  });

  it("deve retornar objeto vazio sem filtros", () => {
    expect(PrismaQueryBuilder.buildWhere()).toEqual({});
  });
});
```

### 13.3 PageMapper

```ts
import { describe, expect, it } from "vitest";
import { PageMapper } from "./page.mapper";

describe("PageMapper", () => {
  it("deve montar page no padrão Spring Data", () => {
    const page = PageMapper.toPage({
      data: [{ id: "1" }],
      total: 11,
      page: 0,
      size: 10,
      sorted: true,
      mapper: (item) => item,
    });

    expect(page.totalPages).toBe(2);
    expect(page.totalElements).toBe(11);
    expect(page.first).toBe(true);
    expect(page.last).toBe(false);
    expect(page.numberOfElements).toBe(1);
    expect(page.pageable.offset).toBe(0);
  });
});
```

---

## 14. Correção do erro de overload do Prisma

### 14.1 Correção do erro de tipo do `UserDelegate`

Erro comum:

```txt
O tipo 'UserDelegate<DefaultArgs, PrismaClientOptions>'
não pode ser atribuído ao tipo 'Delegate<...>'.
Tipos de propriedade 'count' são incompatíveis.
O tipo 'unknown' não pode ser atribuído ao tipo 'UserWhereInput | undefined'.
```

Causa:

```ts
interface Delegate<TModel> {
  count(args: { where?: unknown }): Promise<number>;
}
```

O `unknown` não é compatível com `Prisma.UserWhereInput`.

Correção:

```ts
interface Delegate<TModel, TWhere, TOrderBy> {
  count(args: { where?: TWhere }): Promise<number>;

  findMany(args: {
    where?: TWhere;
    orderBy?: TOrderBy;
    skip?: number;
    take?: number;
  }): Promise<TModel[]>;
}
```

E no repository específico:

```ts
return this.paginate<
  PrismaUserModel,
  UserEntity,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
>({
  params,
  delegate: this.prisma.user,
  mapper: PrismaUserMapper.toDomain,
  allowedSortFields: ["email", "createdAt", "updatedAt"],
  defaultSortField: "createdAt",
  buildWhere: this.buildWhere,
});
```



Erro comum:

```txt
Nenhuma sobrecarga corresponde a esta chamada.
O argumento do tipo '(Promise<number> | Promise<TModel[]>)[]'
não é atribuível ao parâmetro esperado...
```

Causa:

```ts
this.prisma.$transaction([
  delegate.count({ where }),
  delegate.findMany({ where }),
]);
```

O `$transaction([...])` espera `PrismaPromise[]`.

Como o `delegate` genérico foi tipado como `Promise`, o TypeScript escolhe a sobrecarga errada.

Correção:

```ts
const [total, data] = await this.prisma.$transaction(async () => {
  const total = await delegate.count({ where });

  const data = await delegate.findMany({
    where,
    orderBy,
    skip,
    take: size,
  });

  return [total, data] as const;
});
```

Alternativa simples:

```ts
const [total, data] = await Promise.all([
  delegate.count({ where }),
  delegate.findMany({
    where,
    orderBy,
    skip,
    take: size,
  }),
]);
```

Use `$transaction(async () => {})` quando quiser consistência entre `count` e `findMany`.

Use `Promise.all` para paginação simples e leitura de alta performance.

---

## 15. Boas práticas

### Use allowlist para sort

Nunca aceite qualquer campo vindo da URL diretamente:

```ts
allowedSortFields: ["email", "createdAt", "updatedAt"]
```

Isso evita:

- ordenação por campos sensíveis
- bugs de runtime
- queries inválidas
- exposição de detalhes internos

---

### Mantenha PageInput no domínio comum

O `PageInput` não deve importar Prisma.

Correto:

```ts
PageInput
SearchFilter
SortParser
```

Incorreto:

```ts
Prisma.UserWhereInput
Prisma.UserOrderByWithRelationInput
```

---

### Use PrismaQueryBuilder apenas na infraestrutura

O Prisma é detalhe de infraestrutura.

Domínio e aplicação não devem depender dele.

---

## 16. Quando usar ORM e quando usar SQL puro

Use Prisma ORM para:

```txt
CRUD simples
Use cases transacionais
Repositories do domínio
Queries com relacionamento simples
```

Use SQL puro para:

```txt
dashboards
relatórios pesados
analytics
CTEs
window functions
ranking
agrupamentos complexos
consultas com muita performance
```

---

## 17. Próximas evoluções

Depois desta base, você pode evoluir para:

```txt
1. Multi-sort
   sort=name,asc&sort=createdAt,desc

2. OR filters
   email contains gmail OR name contains admin

3. Nested filters
   organization.name contains acme

4. Cursor pagination
   para tabelas muito grandes

5. Full-text search PostgreSQL
   usando GIN indexes e tsvector

6. Specifications Pattern
   para regras complexas por domínio
```

---

## 18. Checklist de implementação

```txt
[ ] Criar pagination.types.ts
[ ] Criar page-request.ts
[ ] Criar filter.types.ts
[ ] Criar sort-parser.ts
[ ] Criar page.mapper.ts
[ ] Criar prisma-query-builder.ts
[ ] Criar prisma-page.repository.ts tipado com TWhere e TOrderBy
[ ] Criar user-page.repository.ts
[ ] Criar prisma-user-page.repository.ts
[ ] Criar testes unitários
[ ] Criar teste de integração com banco
[ ] Validar endpoint GET /users
[ ] Testar sort inválido usando passwordHash
[ ] Testar saída JSON no padrão Spring Data
```

---

## 19. Resultado final

Com essa estrutura, você ganha:

```txt
Código reutilizável
Contratos iguais ao Spring Data
Frontend mais simples
Repository limpo
Menos duplicação
Menos acoplamento ao Prisma
Melhor testabilidade
Base preparada para SaaS enterprise
```
