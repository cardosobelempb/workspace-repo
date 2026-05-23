// ============================================================
// Tipos reutilizáveis do sistema de logs
// ============================================================

export type LoggerMetadata = Record<string, unknown>;

export interface LoggerOptions {
  context?: string;
  traceId?: string;
  requestId?: string;
}
