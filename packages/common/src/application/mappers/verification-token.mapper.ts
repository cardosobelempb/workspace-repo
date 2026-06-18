// ============================================================
// verificationtoken.mapper.ts
// Responsabilidade: converter VerificationTokenEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → VerificationTokenResponseDto  (pós-criação)
//   toUpdatedResponse  → VerificationTokenResponseDto  (pós-atualização)
//   toProjection          → VerificationTokenProjectionDto   (listagem paginada)
//   toHttp             → VerificationTokenResponseDto  (detalhes completos)
// ============================================================

import { VerificationTokenEntity } from "../../domain/entities/verification-token.entity";
import {
  CreateVerificationTokenDto,
  UpdateVerificationTokenDto,
  VerificationTokenProjectionDto,
} from "../dto/verification-token.dto";

export class VerificationTokenMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(
    entity: VerificationTokenEntity,
  ): CreateVerificationTokenDto {
    return {
      identifier: entity.identifier.getValue(),
      token: entity.token,
      expiredAt: entity.expiredAt,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(VerificationTokenMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: VerificationTokenEntity): CreateVerificationTokenDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(VerificationTokenMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: VerificationTokenEntity): UpdateVerificationTokenDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, VerificationTokenMapper.toProjection);

  static toProjection(entity: VerificationTokenEntity): VerificationTokenProjectionDto {
    return {
      identifier: entity.identifier.getValue(),
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: VerificationTokenEntity): VerificationTokenProjectionDto {
    return {
      identifier: entity.identifier.getValue(),
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }
}
