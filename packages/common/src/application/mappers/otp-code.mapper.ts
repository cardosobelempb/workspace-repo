// ============================================================
// otpcode.mapper.ts
// Responsabilidade: converter OtpEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → OtpResponseDto  (pós-criação)
//   toUpdatedResponse  → OtpResponseDto  (pós-atualização)
//   toProjection          → OtpProjectionDto   (listagem paginada)
//   toHttp             → OtpResponseDto  (detalhes completos)
// ============================================================

import { OtpCodeEntity } from "../../domain/entities";
import { CreateOtpCodeDto, OtpCodeProjectionDto, UpdateOtpCodeDto } from "../dto";

export class OtpCodeMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(entity: OtpCodeEntity): CreateOtpCodeDto {
    return {
      email: entity.email.getValue().value,
      codeHash: entity.codeHash,

      ipAddress: entity.ipAddress?.getValue() ?? null,
      userAgent: entity.userAgent?.getValue() ?? null,
      maxAttempts: entity.maxAttempts,
      purpose: entity.purpose,

      expiredAt: entity.expiredAt,
      attempts: entity.attempts,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(OtpCodeMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: OtpCodeEntity): CreateOtpCodeDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(OtpCodeMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: OtpCodeEntity): UpdateOtpCodeDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, OtpCodeMapper.toProjection);

  static toProjection(entity: OtpCodeEntity): OtpCodeProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      purpose: entity.purpose,
      attempts: entity.attempts,
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: OtpCodeEntity): OtpCodeProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      purpose: entity.purpose,
      attempts: entity.attempts,
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }
}
