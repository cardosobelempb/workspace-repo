import { BaseLogger, LoggerMetadata } from "@repo/logger";
import { FastifyBaseLogger, FastifyRequest } from "fastify";

// ============================================================
// Adapter Fastify -> Logger
//
// Responsabilidade:
// - adaptar logger do Fastify
// - manter padrão da aplicação
// - reutilizar requestId automático
// ============================================================

export class FastifyLoggerAdapter extends BaseLogger {
  constructor(
    private readonly loggerInstance: FastifyBaseLogger,
    context?: string,
  ) {
    super({ context });
  }

  info(message: string, meta?: LoggerMetadata): void {
    this.loggerInstance.info(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  warn(message: string, meta?: LoggerMetadata): void {
    this.loggerInstance.warn(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  error(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.loggerInstance.error(
      {
        context: this.context,
        error,
        ...meta,
      },
      message,
    );
  }

  debug(message: string, meta?: LoggerMetadata): void {
    this.loggerInstance.debug(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  fatal(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.loggerInstance.fatal(
      {
        context: this.context,
        error,
        ...meta,
      },
      message,
    );
  }

  child(context: string): BaseLogger {
    return new FastifyLoggerAdapter(
      this.loggerInstance.child({
        context,
      }),
      context,
    );
  }

  // ============================================================
  // Helper útil para requests
  // ============================================================

  static fromRequest(request: FastifyRequest, context?: string): BaseLogger {
    return new FastifyLoggerAdapter(request.log, context);
  }
}
