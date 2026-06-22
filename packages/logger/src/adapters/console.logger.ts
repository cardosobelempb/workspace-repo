import { BaseLogger } from "../base-logger";
import type { ILogger } from "../types/i-logger";
import type { LogContext } from "../types/log-context";

/**
 * Logger leve baseado em console — ideal para desenvolvimento e testes.
 *
 * Não requer Pino nem pino-pretty. Os bindings fixos (ex: `{ context }`)
 * são mesclados em cada chamada para manter o mesmo padrão de child loggers.
 */
export class ConsoleLogger extends BaseLogger {
  trace(message: string, context?: LogContext): void {
    console.trace("[TRACE]", message, this.merged(context));
  }

  debug(message: string, context?: LogContext): void {
    console.debug("[DEBUG]", message, this.merged(context));
  }

  info(message: string, context?: LogContext): void {
    console.log("[INFO]", message, this.merged(context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn("[WARN]", message, this.merged(context));
  }

  error(message: string, context?: LogContext | Error): void {
    console.error("[ERROR]", message, this.merged(this.normalizeError(context)));
  }

  fatal(message: string, context?: LogContext | Error): void {
    console.error("[FATAL]", message, this.merged(this.normalizeError(context)));
  }

  child(bindings: LogContext): ILogger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }

  private merged(context?: LogContext): LogContext {
    return { ...this.bindings, ...context };
  }
}
