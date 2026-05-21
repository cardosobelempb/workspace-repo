## Plan: User Module with Prisma

Implementar o módulo User no backend, mantendo o domínio e os contratos no backend, com repositório Prisma separado por mapper, soft delete desde o início e sem acoplamento de Prisma a DTOs. O fluxo recomendado é: controller/use case -> entity/repository contract -> Prisma repository -> mapper -> Prisma model.

**Steps**

1. Definir o módulo em apps/backend/src/modules/user com separação por camadas: domain, application, infrastructure e presentation. Isso bloqueia os passos seguintes porque define os imports e os pontos de extensão.
2. Criar a entidade User do domínio em apps/backend/src/modules/user/domain/entities, estendendo a base de entidade existente e encapsulando os campos de negócio (id, email, name, createdAt, updatedAt, deletedAt). A entidade deve representar invariantes de domínio; não deve conhecer Prisma nem DTO.
3. Criar o contrato de persistência IUserRepository em apps/backend/src/modules/user/domain/repositories. Esse contrato deve expor operações do caso de uso, por exemplo: findById, findByEmail, create, save, softDelete, restore, exists e list/search se necessário. Esse passo depende da entidade User.
4. Evoluir o schema Prisma em apps/database/prisma/schema.prisma para suportar soft delete em User com deletedAt e, se necessário, índices adicionais para consultas por email + deletedAt. Esse passo pode rodar em paralelo com a modelagem inicial do domínio, mas bloqueia o mapper/repository final porque define o shape persistido.
5. Implementar um mapper PrismaUserMapper em apps/backend/src/modules/user/infrastructure/database que converta User persistence -> User entity e User entity -> Prisma create/update input. Esse é o ponto único de tradução entre banco e domínio. Ele depende do passo 2 e do passo 4.
6. Implementar PrismaUserRepository em apps/backend/src/modules/user/infrastructure/database, herdando o padrão de repositório/base transacional já existente no projeto. O repository deve depender do client/transação Prisma e do PrismaUserMapper, nunca de DTO. Esse passo depende do contrato (3), schema (4) e mapper (5).
7. Expor o Prisma para o backend por uma fronteira clara. Decisão recomendada: reusar o pacote apps/database apenas como provider de client/transação e manter o repository concreto do módulo User no backend. Isso evita que apps/database conheça DTOs ou regras do módulo User. Se necessário, o backend recebe getPrismaClient/PrismaTransactionManager de apps/database e injeta no PrismaUserRepository.
8. Criar DTOs de application em apps/backend/src/modules/user/application/dto apenas para entrada/saída HTTP ou casos de uso. Exemplo: CreateUserInput, UpdateUserInput, UserResponseDto. DTO não entra na camada Prisma. Esse passo pode ocorrer em paralelo com o repository, desde que os casos de uso ainda não dependam dele.
9. Criar use cases em apps/backend/src/modules/user/application/usecases (create-user, get-user-by-id, update-user, delete-user/soft-delete, restore-user, list-users). Cada use case depende apenas de IUserRepository e, quando necessário, TransactionManager.
10. Criar controllers/routes em apps/backend/src/modules/user/presentation usando schemas Zod e response schemas já existentes no monorepo. Controller converte request -> input DTO e output DTO -> response. Isso depende dos use cases.
11. Adicionar testes em três níveis: mapper unitário, repository com Prisma/test db e use case unitário com mock de IUserRepository. Validar também o comportamento de soft delete (find/list não retornam deletados por padrão, restore reabilita, email unique com deletedAt segue a regra escolhida).

**Relevant files**

- d:/workspace-sass/repo/apps/backend/src/server.ts — ponto de entrada atual do backend; deve passar a registrar o módulo User.
- d:/workspace-sass/repo/apps/database/prisma/schema.prisma — modelo User atual; precisa incluir soft delete e possíveis índices/regras de unicidade.
- d:/workspace-sass/repo/apps/database/src/prisma-client/prisma.ts — factory do PrismaClient; referência para injeção do client no backend.
- d:/workspace-sass/repo/apps/database/src/prisma-client/prisma-repository.ts — padrão atual de repositório transacional com withTx.
- d:/workspace-sass/repo/apps/database/src/prisma-client/prisma-transaction-manager.ts — padrão atual de transações via Prisma.
- d:/workspace-sass/repo/packages/common/src/domain/entities/base.entity.ts — base de entidade para o User.
- d:/workspace-sass/repo/packages/common/src/domain/repositories/base.repository.ts — contrato base que orienta o desenho do repository do módulo.

**Verification**

1. Rodar typecheck no backend e no database após adicionar o módulo e a evolução do schema.
2. Rodar os testes do módulo User no backend e os testes do pacote database relacionados ao Prisma repository/mapper.
3. Executar prisma generate e a migração correspondente ao campo deletedAt.
4. Validar manualmente os fluxos create/get/update/delete/restore/list em uma rota ou teste de integração.
5. Confirmar que DTOs não são importados em apps/database nem no PrismaUserMapper/repository.

**Decisions**

- O módulo User ficará no backend.
- User terá soft delete desde o início.
- Prisma repository conversa apenas com entidades + mappers; DTO fica na camada de aplicação/apresentação.
- Recomendação: apps/database não deve conhecer o módulo User; ele fornece infraestrutura Prisma genérica, enquanto o módulo User implementa seu repository concreto no backend.

**Further Considerations**

1. Regra de unicidade do email com soft delete: Opção A manter unique global em email e impedir recriação após delete. Opção B usar índice composto/estratégia para permitir recriação após soft delete. Recomendação: começar com Opção A para simplificar regra de negócio.
2. Value Object para email/nome: Opção A usar string validada por Zod só na borda. Opção B criar EmailVO/NameVO no domínio. Recomendação: começar com A se quiser velocidade; migrar para VO se houver regras de negócio fortes.
3. Local do mapper PrismaUserMapper: Opção A no backend junto do módulo User. Opção B em apps/database. Recomendação: A, para evitar que o pacote de infraestrutura passe a depender do contexto do módulo.
