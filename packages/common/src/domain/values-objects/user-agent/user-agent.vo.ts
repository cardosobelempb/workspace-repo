import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

const MAX_LENGTH = 512;

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

/**
 * 🖥️ UserAgentVO
 *
 * Encapsula a string User-Agent de uma requisição HTTP.
 * Expõe metadados de dispositivo, browser e OS via parsing leve sem biblioteca.
 */
export class UserAgentVO extends BaseVO<string> {
  private constructor(value: string) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um User-Agent obrigatório.
   */
  public static create(raw: string): UserAgentVO {
    if (!raw || raw.trim().length === 0) {
      throw new BadRequestError({
        fieldName: "userAgent",
        message: "User-Agent cannot be empty.",
      });
    }

    const instance = new UserAgentVO(raw.trim());

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "userAgent",
        message: `User-Agent must be at most ${MAX_LENGTH} characters.`,
      });
    }

    return instance;
  }

  /**
   * ✅ Cria com fallback para "unknown".
   * Use quando o header pode estar ausente.
   */
  public static createOrUnknown(raw: string | undefined | null): UserAgentVO {
    if (!raw) return new UserAgentVO("unknown");
    try {
      return UserAgentVO.create(raw);
    } catch {
      return new UserAgentVO("unknown");
    }
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return this.value.length > 0 && this.value.length <= MAX_LENGTH;
  }

  // ─── Accessors ────────────────────────────────────────────

  public get deviceType(): DeviceType {
    const ua = this.value;
    if (ua === "unknown") return "unknown";
    if (/bot|crawler|spider|crawling/i.test(ua)) return "bot";
    if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/windows|macintosh|linux/i.test(ua)) return "desktop";
    return "unknown";
  }

  public get browser(): string {
    const ua = this.value;
    if (/Edg\//i.test(ua)) return "Edge";
    if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
    if (/Firefox\//i.test(ua)) return "Firefox";
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
    if (/MSIE|Trident/i.test(ua)) return "Internet Explorer";
    if (/OPR\//i.test(ua)) return "Opera";
    return "unknown";
  }

  public get os(): string {
    const ua = this.value;
    if (/Windows NT/i.test(ua)) return "Windows";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    return "unknown";
  }
}
