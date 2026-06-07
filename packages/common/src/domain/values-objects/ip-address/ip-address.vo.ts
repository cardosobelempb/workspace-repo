import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

// IPv4: 4 octetos 0–255
const IPV4_REGEX = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

// IPv6: 8 grupos de 4 hex separados por : (ou forma compactada com ::)
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?)$/;

export type IpVersion = "v4" | "v6" | "unknown";

/**
 * 🌐 IpAddressVO
 *
 * Encapsula um endereço IPv4 ou IPv6 validado.
 * Oferece fallback seguro para "unknown" quando o IP não está disponível.
 */
export class IpAddressVO extends BaseVO<string> {
  private constructor(value: string) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um IP obrigatório.
   * Lança erro se o formato for inválido.
   */
  public static create(raw: string): IpAddressVO {
    if (!raw || raw.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "ipAddress",
        message: "IP address cannot be empty.",
      });
    }

    const instance = new IpAddressVO(raw.trim());

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "ipAddress",
        message: "Invalid IP address format (IPv4 or IPv6 expected).",
      });
    }

    return instance;
  }

  /**
   * ✅ Cria com fallback para "unknown".
   * Use em controllers onde o header pode estar ausente.
   */
  public static createOrUnknown(raw: string | undefined | null): IpAddressVO {
    if (!raw) return new IpAddressVO("unknown");
    try {
      return IpAddressVO.create(raw);
    } catch {
      return new IpAddressVO("unknown");
    }
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    if (this.value === "unknown") return true;
    return IPV4_REGEX.test(this.value) || IPV6_REGEX.test(this.value);
  }

  // ─── Accessors ────────────────────────────────────────────

  public get version(): IpVersion {
    if (this.value === "unknown") return "unknown";
    if (IPV4_REGEX.test(this.value)) return "v4";
    return "v6";
  }

  public get isLoopback(): boolean {
    return this.value === "127.0.0.1" || this.value === "::1";
  }

  public get isPrivate(): boolean {
    if (this.value === "unknown" || this.version === "v6") return false;
    const [a, b] = this.value.split(".").map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
}
