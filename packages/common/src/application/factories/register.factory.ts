// ─── Factory ─────────────────────────────────────────────────────────────────

import { EmailVO, PasswordHashVO, UserEntity } from "@/common/domain";
import { CreateUserDto, UserRegisterDto } from "../dto";
import { RegisterDto } from "../dto/register.dto";

/**
 * Fábrica de entidades do fluxo de registro.
 *
 * ✅ SRP: responsabilidade única — construir entidades do contexto de registro.
 * ✅ Extensível: adicione novos builders sem tocar no Use Case.
 * ✅ Testável: cada método é puro (sem I/O), testável de forma isolada.
 * ✅ Desacoplada: o Use Case não precisa conhecer VOs nem regras de construção.
 */
export class RegisterFactory {
  /**
   * Cria a entidade de usuário com e-mail e senha já hasheada.
   */
  static build(input: RegisterDto): RegisterDto {
    return {
      email: input.email,
      password: input.password,
    };
  }

  static buildUserLogin({ email, passwordHash }: CreateUserDto): UserEntity {
    return UserEntity.create({
      email: EmailVO.create(email),
      passwordHash: PasswordHashVO.create(passwordHash),
    });
  }

  static buildUserRegister(input: UserRegisterDto): UserEntity {
    return UserEntity.create({
      email: EmailVO.create(input.email),
      passwordHash: PasswordHashVO.create(input.passwordHash),
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
