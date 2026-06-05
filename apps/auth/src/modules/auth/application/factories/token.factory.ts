// ─── Factory ─────────────────────────────────────────────────────────────────

import { IpAddressVO, UUIDVO } from "@repo/common";
import { TokenEntity } from "../../domain/entities/token.entity";
import { CreateTokenDto } from "../dto/token.dto";

/**
 * Fábrica de entidades do fluxo de registro.
 *
 * ✅ SRP: responsabilidade única — construir entidades do contexto de registro.
 * ✅ Extensível: adicione novos builders sem tocar no Use Case.
 * ✅ Testável: cada método é puro (sem I/O), testável de forma isolada.
 * ✅ Desacoplada: o Use Case não precisa conhecer VOs nem regras de construção.
 */
export class TokenFactory {
  /**
   * Cria a entidade de usuário com e-mail e senha já hasheada.
   */
  static build(input: CreateTokenDto): TokenEntity {
    return TokenEntity.create({
      userId: UUIDVO.create(input.userId),
      type: input.type,
      valueHash: input.valueHash,
      expiredAt: input.expiredAt,
      ipAddress: IpAddressVO.create(input.ipAddress),
      userAgent: input.userAgent,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 👇 Adicione novos builders aqui conforme o fluxo de registro evoluir
  // Exemplos futuros:
  //   static buildOnboardingChecklist(...)
  //   static buildDefaultNotificationSettings(...)
  //   static buildTrialSubscription(...)
  // ──────────────────────────────────────────────────────────────────────────
}
