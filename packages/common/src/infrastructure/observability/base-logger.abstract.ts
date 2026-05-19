// ============================================================
// logger.abstract.ts
// Contrato abstrato do sistema de logs.
// ============================================================

import { BaseLogMeta } from "./types/base-log-meta.type";

/**
 * Logger abstrato da aplicação.
 *
 * Responsabilidades:
 * - Padronizar logs da aplicação
 * - Permitir múltiplas implementações
 * - Facilitar troca de provider
 * - Centralizar helpers comuns
 *
 * Exemplos:
 * - ConsoleLogger
 * - PinoLogger
 * - WinstonLogger
 * - FastifyLoggerAdapter
 * - SentryLogger
 */
export abstract class BaseLogger {
  /**
   * Log de debug
   *
   * Usado em:
   * - desenvolvimento
   * - rastreamento
   * - debugging
   */
  abstract debug(meta?: BaseLogMeta, message?: string): void;

  /**
   * Log informativo
   *
   * Usado para:
   * - eventos importantes
   * - fluxo da aplicação
   * - auditoria leve
   */
  abstract info(meta?: BaseLogMeta, message?: string): void;

  /**
   * Log de alerta
   *
   * Usado para:
   * - comportamento inesperado
   * - falhas recuperáveis
   * - validações
   */
  abstract warn(meta?: BaseLogMeta, message?: string): void;

  /**
   * Log de erro
   *
   * Usado para:
   * - exceptions
   * - falhas críticas
   * - problemas de infraestrutura
   */
  abstract error(meta?: BaseLogMeta, message?: string): void;

  // ============================================================
  // Helpers compartilhados
  // ============================================================

  /**
   * Adiciona timestamp padronizado.
   */
  protected withTimestamp(meta?: BaseLogMeta): BaseLogMeta {
    return {
      timestamp: new Date().toISOString(),
      ...meta,
    };
  }

  /**
   * Helper para serializar erro.
   */
  protected serializeError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return error;
  }
}
