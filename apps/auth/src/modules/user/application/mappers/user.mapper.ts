// ============================================================
// user.mapper.ts
// Responsabilidade: converter UserEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → UserResponseDto  (pós-criação)
//   toUpdatedResponse  → UserResponseDto  (pós-atualização)
//   toProjection          → UserProjectionDto   (listagem paginada)
//   toHttp             → UserResponseDto  (detalhes completos)
// ============================================================

import { UserEntity } from "@/modules/user/domain/entities/user.entity";
import { CreateUserDto, UpdateUserDto, UserProjectionDto } from "../dto/user.dto";

export class UserMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(entity: UserEntity): CreateUserDto {
    return {
      email: entity.email.toString(),
      passwordHash: entity.passwordHash.toString(),
      emailVerified: entity.emailVerified,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(UserMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: UserEntity): CreateUserDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(UserMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: UserEntity): UpdateUserDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, UserMapper.toProjection);

  static toProjection(entity: UserEntity): UserProjectionDto {
    return {
      id: entity.id.toString(),
      email: entity.email.toString(),
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: UserEntity): UserProjectionDto {
    return {
      id: entity.id.toString(),
      email: entity.email.toString(),
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
    };
  }
}
