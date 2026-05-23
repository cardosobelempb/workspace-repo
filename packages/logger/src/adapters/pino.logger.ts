import pino, { Logger as PinoInstance } from "pino";
import { BaseLogger } from "../base-logger";
import { LoggerMetadata, LoggerOptions } from "../logger.types";

// ============================================================
// Logger baseado em Pino
//
// Melhor performance para Node.js
// Estruturado JSON
// Excelente para observabilidade
// ============================================================

export class PinoLogger extends BaseLogger {
  private readonly logger: PinoInstance;

  constructor(options?: LoggerOptions, instance?: PinoInstance) {
    super(options);

    this.logger =
      instance ??
      pino({
        level: process.env.LOG_LEVEL ?? "info",

        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                },
              }
            : undefined,
      });
  }

  info(message: string, meta?: LoggerMetadata): void {
    this.logger.info(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  warn(message: string, meta?: LoggerMetadata): void {
    this.logger.warn(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  error(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.logger.error(
      {
        context: this.context,
        error,
        ...meta,
      },
      message,
    );
  }

  debug(message: string, meta?: LoggerMetadata): void {
    this.logger.debug(
      {
        context: this.context,
        ...meta,
      },
      message,
    );
  }

  fatal(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.logger.fatal(
      {
        context: this.context,
        error,
        ...meta,
      },
      message,
    );
  }

  child(context: string): BaseLogger {
    return new PinoLogger({ context }, this.logger.child({ context }));
  }
}
