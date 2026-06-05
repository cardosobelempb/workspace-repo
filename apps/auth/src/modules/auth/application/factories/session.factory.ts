// ─── Factory ─────────────────────────────────────────────────────────────────

import { UUIDVO } from "@repo/common";
import { SessionEntity } from "../../domain/entities/session.entity";
import { CreateSessionDto } from "../dto/session.dto";

/**
 * Fábrica de entidades do fluxo de registro.
 *
 * ✅ SRP: responsabilidade única — construir entidades do contexto de registro.
 * ✅ Extensível: adicione novos builders sem tocar no Use Case.
 * ✅ Testável: cada método é puro (sem I/O), testável de forma isolada.
 * ✅ Desacoplada: o Use Case não precisa conhecer VOs nem regras de construção.
 */
export class SessionFactory {
  /**
   * Cria a entidade de usuário com e-mail e senha já hasheada.
   */
  static build({ userId, sessionToken, expires }: CreateSessionDto): SessionEntity {
    return SessionEntity.create({
      userId: UUIDVO.create(userId),
      sessionToken: sessionToken,
      expires: expires,
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
