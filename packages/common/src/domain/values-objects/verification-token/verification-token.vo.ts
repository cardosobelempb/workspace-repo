import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

const TOKEN_REGEX = /^[A-Za-z0-9\-_]{32,256}$/;

export type VerificationPurpose =
  | "email-verification"
  | "password-reset"
  | "account-deletion"
  | "two-factor-setup"
  | "email-change";

export interface VerificationTokenData {
  token: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
}

/** TTL padrão em minutos para cada propósito */
const DEFAULT_TTL: Record<VerificationPurpose, number> = {
  "email-verification": 60 * 24, // 24h
  "password-reset": 15, // 15min
  "account-deletion": 60, // 1h
  "two-factor-setup": 30, // 30min
  "email-change": 60 * 24, // 24h
};

const VALID_PURPOSES = Object.keys(DEFAULT_TTL) as VerificationPurpose[];

/**
 * 🔗 VerificationTokenVO
 *
 * Encapsula um token de verificação com propósito explícito e expiração.
 * TTL padrão varia por propósito; pode ser sobrescrito.
 */
export class VerificationTokenVO extends BaseVO<VerificationTokenData> {
  private constructor(value: VerificationTokenData) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de token, propósito e expiração existentes.
   * Use ao remontar a entidade do banco.
   */
  public static create(
    token: string,
    purpose: VerificationPurpose,
    expiresAt: Date,
  ): VerificationTokenVO {
    if (!token || token.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "verificationToken",
        message: "Verification token cannot be empty.",
      });
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      throw new BadRequestError({
        fieldName: "verificationToken",
        message: `Invalid verification purpose. Allowed: ${VALID_PURPOSES.join(", ")}.`,
      });
    }

    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new BadRequestError({
        fieldName: "verificationToken",
        message: "Verification token expiration date is invalid.",
      });
    }

    const instance = new VerificationTokenVO({
      token: token.trim(),
      purpose,
      expiresAt,
    });

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "verificationToken",
        message: "Verification token has an invalid format.",
      });
    }

    return instance;
  }

  /**
   * ✅ Gera um novo token seguro de 48 bytes (64 chars base64url).
   * @param purpose    Propósito do token.
   * @param ttlMinutes TTL personalizado. Se omitido, usa o padrão do propósito.
   */
  public static generate(
    purpose: VerificationPurpose,
    ttlMinutes?: number,
  ): VerificationTokenVO {
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const ttl = ttlMinutes ?? DEFAULT_TTL[purpose];
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    return new VerificationTokenVO({ token, purpose, expiresAt });
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return TOKEN_REGEX.test(this.value.token);
  }

  // ─── Accessors ────────────────────────────────────────────

  public get token(): string {
    return this.value.token;
  }

  public get purpose(): VerificationPurpose {
    return this.value.purpose;
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
   * Compara o candidato com o token armazenado.
   * Retorna `false` automaticamente se já estiver expirado.
   */
  public matches(candidate: string): boolean {
    if (this.isExpired) return false;
    return this.value.token === candidate.trim();
  }

  public toJSON(): { purpose: VerificationPurpose; expiresAt: Date } {
    return { purpose: this.value.purpose, expiresAt: this.value.expiresAt };
  }
}
