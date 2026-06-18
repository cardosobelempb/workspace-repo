// ============================================================
// session.mapper.ts
// Responsabilidade: converter SessionEntity → DTOs de resposta
//
// Métodos públicos:
//   toCreatedResponse  → SessionResponseDto  (pós-criação)
//   toUpdatedResponse  → SessionResponseDto  (pós-atualização)
//   toProjection          → SessionProjectionDto   (listagem paginada)
//   toHttp             → SessionResponseDto  (detalhes completos)
// ============================================================

import { SessionEntity } from "../../domain/entities/session.entity";
import {
  CreateSessionDto,
  SessionProjectionDto,
  UpdateSessionDto,
} from "../dto/session.dto";

export class SessionMapper {
  // ─── Helper privado ───────────────────────────────────────────────────
  //
  // Centraliza a conversão dos campos comuns a create e update.
  // Evita duplicação (DRY) e garante consistência entre os dois mappers.
  //
  // ⚠️  Usamos ?? (nullish coalescing) e não || (OR lógico):
  //     entity.order pode ser 0  → || "" trataria como falsy (bug silencioso)
  //     entity.slug  pode ser "" → intencionalmente vazio, não deve virar null

  private static toCoreFields(entity: SessionEntity): CreateSessionDto {
    return {
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
    };
  }

  // ─── Pós-criação ──────────────────────────────────────────────────────
  //
  // Retorna os campos persistidos imediatamente após o INSERT.
  // Ideal para confirmar ao cliente o que foi salvo.
  //
  // @example
  //   return right(SessionMapper.toCreatedResponse(entity));

  static toCreatedResponse(entity: SessionEntity): CreateSessionDto {
    return this.toCoreFields(entity);
  }

  // ─── Pós-atualização ─────────────────────────────────────────────────
  //
  // Retorna os campos após o UPDATE.
  // Estrutura idêntica ao create; separe aqui caso precise adicionar
  // campos de auditoria (updatedAt, updatedBy, changedFields…).
  //
  // @example
  //   return right(SessionMapper.toUpdatedResponse(entity));

  static toUpdatedResponse(entity: SessionEntity): UpdateSessionDto {
    return this.toCoreFields(entity);
  }

  // ─── Resumo para listagem paginada ───────────────────────────────────
  //
  // Versão compacta da entidade: expõe apenas o necessário para
  // renderizar uma linha de tabela/card, evitando over-fetching.
  //
  // @example
  //   const page = PageResponseMapper.toDto(result, SessionMapper.toProjection);

  static toProjection(entity: SessionEntity): SessionProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires,
    };
  }

  // ─── Detalhes completos (GET by id / resposta HTTP) ───────────────────
  //
  // Payload completo enviado em endpoints de detalhe.
  // Inclui campos de auditoria (createdAt) ausentes no resumo.

  static toHttp(entity: SessionEntity): SessionProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires,
    };
  }
}
