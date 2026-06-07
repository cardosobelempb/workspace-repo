import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

/** JWT: 3 segmentos base64url separados por ponto */
const JWT_REGEX = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
/** Token opaco: hex ou base64url, 32–512 chars */
const OPAQUE_REGEX = /^[A-Za-z0-9\-_]{32,512}$/;

export type SessionTokenType = "jwt" | "opaque";

/**
 * 🎫 SessionTokenVO
 *
 * Encapsula um token de sessão (JWT ou opaco).
 * Nunca expõe o valor em logs ou serialização.
 */
export class SessionTokenVO extends BaseVO<string> {
  private constructor(value: string) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um token existente (JWT ou opaco).
   */
  public static create(raw: string): SessionTokenVO {
    if (!raw || raw.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "sessionToken",
        message: "Session token cannot be empty.",
      });
    }

    const instance = new SessionTokenVO(raw.trim());

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "sessionToken",
        message: "Invalid session token format.",
      });
    }

    return instance;
  }

  /**
   * ✅ Gera um token opaco criptograficamente seguro de 64 bytes (128 chars hex).
   * Requer Node 15+ ou ambiente com WebCrypto.
   */
  public static generate(): SessionTokenVO {
    const bytes = crypto.getRandomValues(new Uint8Array(64));
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return new SessionTokenVO(hex);
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return JWT_REGEX.test(this.value) || OPAQUE_REGEX.test(this.value);
  }

  // ─── Accessors ────────────────────────────────────────────

  public get type(): SessionTokenType {
    return JWT_REGEX.test(this.value) ? "jwt" : "opaque";
  }

  /**
   * Payload bruto (base64url) do JWT, sem verificação de assinatura.
   * Retorna `null` para tokens opacos.
   */
  public get jwtPayloadRaw(): string | null {
    if (this.type !== "jwt") return null;
    return this.value.split(".")[1];
  }

  /** Nunca exibe o token em logs ou serialização */
  public toString(): string {
    return "***";
  }
}
