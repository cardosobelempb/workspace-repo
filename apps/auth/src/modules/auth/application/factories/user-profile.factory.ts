// ─── Factory ─────────────────────────────────────────────────────────────────

import { CreateUserProfileDto } from "@/modules/user/application/dto/user-profile.dto";
import { UserProfileEntity } from "@/modules/user/domain/entities/user-profile.entity";
import { BirthDateVO, DocumentType, PhoneVO, UrlVO, UUIDVO } from "@repo/common";

/**
 * Fábrica de entidades do fluxo de registro.
 *
 * ✅ SRP: responsabilidade única — construir entidades do contexto de registro.
 * ✅ Extensível: adicione novos builders sem tocar no Use Case.
 * ✅ Testável: cada método é puro (sem I/O), testável de forma isolada.
 * ✅ Desacoplada: o Use Case não precisa conhecer VOs nem regras de construção.
 */
export class UserProfileFactory {
  /**
   * Cria a entidade de usuário com e-mail e senha já hasheada.
   */
  static build(input: CreateUserProfileDto): UserProfileEntity {
    return UserProfileEntity.create({
      userId: UUIDVO.create(input.userId),
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: UrlVO.create(input.avatarUrl), // Placeholder, pode ser atualizado depois
      birthDate: BirthDateVO.create(input.birthDate), // Ajuste conforme o formato de entrada
      phone: PhoneVO.create(input.phone), // Ajuste conforme o formato de entrada
      documentType: DocumentType.CPF || "",
      documentNumber: input.documentNumber ? input.documentNumber : "",
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
