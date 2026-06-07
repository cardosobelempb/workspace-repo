import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

const OTP_REGEX = /^\d{4,8}$/;

export interface OtpCodeData {
  code: string;
  expiresAt: Date;
}

/**
 * 🔢 OtpCodeVO
 *
 * Encapsula um código OTP numérico (4–8 dígitos) com expiração.
 * Nunca expõe o código em logs ou serialização.
 */
export class OtpCodeVO extends BaseVO<OtpCodeData> {
  private constructor(value: OtpCodeData) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um código e data de expiração existentes.
   * Use ao remontar a entidade do banco.
   */
  public static create(code: string, expiresAt: Date): OtpCodeVO {
    if (!code || code.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "otpCode",
        message: "OTP code cannot be empty.",
      });
    }

    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new BadRequestError({
        fieldName: "otpCode",
        message: "OTP expiration date is invalid.",
      });
    }

    const instance = new OtpCodeVO({ code: code.trim(), expiresAt });

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "otpCode",
        message: "OTP code must contain between 4 and 8 numeric digits.",
      });
    }

    return instance;
  }

  /**
   * ✅ Gera um novo OTP numérico de N dígitos com validade em minutos.
   * @param digits  Número de dígitos (4–8). Padrão: 6.
   * @param ttlMinutes  Tempo de validade em minutos. Padrão: 10.
   */
  public static generate(digits: 4 | 5 | 6 | 7 | 8 = 6, ttlMinutes = 10): OtpCodeVO {
    const max = Math.pow(10, digits);
    const raw = crypto.getRandomValues(new Uint32Array(1))[0] % max;
    const code = String(raw).padStart(digits, "0");
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    return new OtpCodeVO({ code, expiresAt });
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return OTP_REGEX.test(this.value.code);
  }

  // ─── Accessors ────────────────────────────────────────────

  public get code(): string {
    return this.value.code;
  }

  public get expiresAt(): Date {
    return this.value.expiresAt;
  }

  public get isExpired(): boolean {
    return Date.now() > this.value.expiresAt.getTime();
  }

  public get remainingMs(): number {
    return Math.max(0, this.value.expiresAt.getTime() - Date.now());
  }

  /**
   * Compara o candidato com o código armazenado.
   * Retorna `false` automaticamente se já estiver expirado.
   */
  public matches(candidate: string): boolean {
    if (this.isExpired) return false;
    return this.value.code === candidate.trim();
  }

  /** Nunca exibe o código em logs ou serialização */
  public toString(): string {
    return "***";
  }
}
