import { LoggerMetadata, LoggerOptions } from "./logger.types";

// ============================================================
// Logger Abstrato
//
// Responsabilidade:
// - padronizar logging da aplicação
// - desacoplar provider (Pino, Winston, Console)
// - permitir adapters reutilizáveis
//
// Benefícios:
// ✅ SOLID
// ✅ DIP (Dependency Inversion)
// ✅ Reutilizável
// ✅ Testável
// ============================================================

export abstract class BaseLogger {
  protected context?: string;

  constructor(options?: LoggerOptions) {
    this.context = options?.context;
  }

  abstract info(message: string, meta?: LoggerMetadata): void;

  abstract warn(message: string, meta?: LoggerMetadata): void;

  abstract error(message: string, error?: unknown, meta?: LoggerMetadata): void;

  abstract debug(message: string, meta?: LoggerMetadata): void;

  abstract fatal(message: string, error?: unknown, meta?: LoggerMetadata): void;

  // ============================================================
  // Cria child logger
  // Muito útil para contexto por módulo
  // ============================================================

  abstract child(context: string): BaseLogger;
}
