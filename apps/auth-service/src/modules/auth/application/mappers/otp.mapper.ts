// ============================================================
// otp.mapper.ts
// Responsabilidade: converter OtpEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → OtpResponseDto  (pós-criação)
//   toUpdatedResponse  → OtpResponseDto  (pós-atualização)
//   toProjection          → OtpProjectionDto   (listagem paginada)
//   toHttp             → OtpResponseDto  (detalhes completos)
// ============================================================

import { OtpEntity } from "../../domain/entities/otp.entity";
import { CreateOtpDto, OtpProjectionDto, UpdateOtpDto } from "../dto/otp.dto";

export class OtpMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(entity: OtpEntity): CreateOtpDto {
    return {
      userId: entity.userId.getValue(),
      phone: entity.phone.getValue(),
      codeHash: entity.codeHash,
      attempts: entity.attempts,
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(OtpMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: OtpEntity): CreateOtpDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(OtpMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: OtpEntity): UpdateOtpDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, OtpMapper.toProjection);

  static toProjection(entity: OtpEntity): OtpProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      phone: entity.phone.getValue(),
      expiredAt: entity.expiredAt,
      attempts: entity.attempts,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: OtpEntity): OtpProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      phone: entity.phone.getValue(),
      expiredAt: entity.expiredAt,
      usedAt: entity.usedAt,
      attempts: entity.attempts,
      createdAt: entity.createdAt,
    };
  }
}
