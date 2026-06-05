import { BaseVO } from "../base.vo";

/**
 * JSON primitivo permitido
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON Value
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

/**
 * MetadataVO
 *
 * Utilizado para:
 *
 * - Audit Logs
 * - Eventos de domínio
 * - Integrações
 * - Tracking
 */
export class MetadataVO extends BaseVO<JsonObject> {
  private constructor(value: JsonObject) {
    super(Object.freeze(value));
  }

  static create(value?: JsonObject | null): MetadataVO {
    return new MetadataVO(value ?? {});
  }

  public isValid(): boolean {
    return MetadataVO.isValidJson(this.value);
  }

  public static validate(value?: JsonObject | null): boolean {
    return MetadataVO.isValidJson(value ?? {});
  }

  /**
   * Recupera uma chave
   */
  public get<T extends JsonValue>(key: string): T | undefined {
    return this.value[key] as T;
  }

  /**
   * Verifica existência
   */
  public has(key: string): boolean {
    return key in this.value;
  }

  /**
   * Serialização segura
   */
  public toJSON(): JsonObject {
    return structuredClone(this.value);
  }

  isEmpty(): boolean {
    return Object.keys(this.value).length === 0;
  }

  /**
   * Merge imutável
   */
  public merge(data: JsonObject): MetadataVO {
    return MetadataVO.create({
      ...this.value,
      ...data,
    });
  }

  /**
   * Deep validation
   */
  private static isValidJson(value: unknown): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna vazio
   */
  public static empty(): MetadataVO {
    return new MetadataVO({});
  }
}
