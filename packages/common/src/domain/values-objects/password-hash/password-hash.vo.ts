import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

/**
 * Formato bcrypt: $2a$, $2b$ ou $2y$ + 2 dígitos de custo + 53 chars
 * Exemplo: $2b$12$...
 */
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * 🔑 PasswordHashVO
 *
 * Representa um hash bcrypt já gerado e persistido.
 * Valida o formato sem jamais expor o conteúdo.
 */
export class PasswordHashVO extends BaseVO<string> {
  private constructor(value: string) {
    super(value);
  }

  // ─── Factory ──────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um hash bcrypt existente.
   * Use ao remontar uma entidade do banco de dados.
   */
  public static create(hash: string): PasswordHashVO {
    if (!hash || hash.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "passwordHash",
        message: "Password hash cannot be empty.",
      });
    }

    const instance = new PasswordHashVO(hash.trim());

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "passwordHash",
        message: "Invalid bcrypt hash format.",
      });
    }

    return instance;
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return BCRYPT_REGEX.test(this.value);
  }

  // ─── Accessors ────────────────────────────────────────────

  /**
   * Custo (salt rounds) extraído do hash bcrypt.
   * Ex.: $2b$12$... → 12
   */
  public get rounds(): number {
    return parseInt(this.value.split("$")[2], 10);
  }

  /** Nunca exibe o hash em logs ou serialização */
  public toString(): string {
    return "***";
  }
}
