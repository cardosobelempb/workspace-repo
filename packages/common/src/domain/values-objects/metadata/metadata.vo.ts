import { BadRequestError } from "../../errors/controllers/bad-request.error";
import { BaseVO } from "../base.vo";

export type MetadataRecord = Record<string, string | number | boolean | null>;

const MAX_KEYS = 50;

/**
 * 🗂️ MetadataVO
 *
 * Encapsula um mapa de metadados arbitrários e imutáveis.
 * Toda mutação retorna uma nova instância (imutabilidade funcional).
 */
export class MetadataVO extends BaseVO<MetadataRecord> {
  private constructor(value: MetadataRecord) {
    super(value);
  }

  // ─── Factories ────────────────────────────────────────────

  /**
   * ✅ Cria a partir de um objeto de metadados.
   */
  public static create(raw: MetadataRecord): MetadataVO {
    const instance = new MetadataVO(raw);

    if (!instance.isValid()) {
      throw new BadRequestError({
        fieldName: "metadata",
        message: `Metadata cannot have more than ${MAX_KEYS} keys.`,
      });
    }

    return instance;
  }

  /** ✅ Cria um MetadataVO vazio */
  public static empty(): MetadataVO {
    return new MetadataVO({});
  }

  // ─── Validação ────────────────────────────────────────────

  public isValid(): boolean {
    return Object.keys(this.value).length <= MAX_KEYS;
  }

  // ─── Accessors ────────────────────────────────────────────

  public get<T extends string | number | boolean | null>(key: string): T | undefined {
    return this.value[key] as T | undefined;
  }

  public has(key: string): boolean {
    return key in this.value;
  }

  public get size(): number {
    return Object.keys(this.value).length;
  }

  // ─── Mutações imutáveis ───────────────────────────────────

  /**
   * Retorna um **novo** MetadataVO com a chave adicionada/atualizada.
   */
  public with(key: string, val: string | number | boolean | null): MetadataVO {
    return MetadataVO.create({ ...this.value, [key]: val });
  }

  /**
   * Retorna um **novo** MetadataVO sem a chave informada.
   */
  public without(key: string): MetadataVO {
    const { [key]: _, ...rest } = this.value;
    return MetadataVO.create(rest);
  }

  // ─── Serialização ─────────────────────────────────────────

  public toJSON(): MetadataRecord {
    return { ...this.value };
  }

  public toString(): string {
    return JSON.stringify(this.value);
  }
}
