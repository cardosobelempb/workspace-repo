// ============================================================
// userprofile.mapper.ts
// Responsabilidade: converter UserProfileEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → UserProfileResponseDto  (pós-criação)
//   toUpdatedResponse  → UserProfileResponseDto  (pós-atualização)
//   toProjection          → UserProfileProjectionDto   (listagem paginada)
//   toHttp             → UserProfileResponseDto  (detalhes completos)
// ============================================================

import { UserProfileEntity } from "../../domain/entities/user-profile.entity";
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileProjectionDto,
} from "../dto/user-profile.dto";

export class UserProfileProfileMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(entity: UserProfileEntity): CreateUserProfileDto {
    return {
      userId: entity.userId.toString(),
      fullName: entity.fullName,
      status: entity.status,
      firstName: entity.firstName,
      lastName: entity.lastName,
      displayName: entity.displayName,
      birthDate: entity.birthDate.getValue(),
      phone: entity.phone.toString(),
      avatarUrl: entity.avatarUrl.toString(),
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(UserProfileMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: UserProfileEntity): CreateUserProfileDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(UserProfileMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: UserProfileEntity): UpdateUserProfileDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, UserProfileMapper.toProjection);

  static toProjection(entity: UserProfileEntity): UserProfileProjectionDto {
    return {
      id: entity.id.toString(),
      userId: entity.userId.toString(),
      firstName: entity.firstName,
      lastName: entity.lastName,
      avatarUrl: entity.avatarUrl.toString(),
      status: entity.status,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: UserProfileEntity): UserProfileProjectionDto {
    return {
      id: entity.id.toString(),
      userId: entity.userId.toString(),
      firstName: entity.firstName,
      lastName: entity.lastName,
      avatarUrl: entity.avatarUrl.toString(),
      status: entity.status,
    };
  }
}
