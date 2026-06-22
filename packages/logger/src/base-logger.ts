import type { ILogger } from "./types/i-logger";
import type { LogContext } from "./types/log-context";

/**
 * Classe base abstrata para todas as implementações de logger.
 *
 * Extend esta classe para criar adapters de framework (Fastify, NestJS, etc.)
 * ou implementações alternativas (Console, mock para testes).
 *
 * Garante que todos os loggers do projeto compartilhem o contrato de `ILogger`
 * e o utilitário `normalizeError` — sem duplicação de código.
 */
export abstract class BaseLogger implements ILogger {
  constructor(protected readonly bindings: LogContext = {}) {}

  abstract trace(message: string, context?: LogContext): void;
  abstract debug(message: string, context?: LogContext): void;
  abstract info(message: string, context?: LogContext): void;
  abstract warn(message: string, context?: LogContext): void;
  abstract error(message: string, context?: LogContext | Error): void;
  abstract fatal(message: string, context?: LogContext | Error): void;
  abstract child(bindings: LogContext): ILogger;

  async flush(): Promise<void> {}

  protected normalizeError(context?: LogContext | Error): LogContext {
    if (context instanceof Error) {
      return {
        error: {
          name: context.name,
          message: context.message,
          stack: context.stack,
        },
      };
    }
    return context ?? {};
  }
}
