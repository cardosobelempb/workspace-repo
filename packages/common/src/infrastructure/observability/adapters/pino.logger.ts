import pino, { Logger as PinoInstance } from "pino";

import { BaseLogger } from "../base-logger";
import { RequestContext } from "../context/request-context";
import { LoggerMetadata, LoggerOptions } from "../logger.types";

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
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
      });
  }

  private buildMeta(meta?: LoggerMetadata): LoggerMetadata {
    const context = RequestContext.get();

    return {
      context: this.context,
      requestId: context?.requestId,
      traceId: context?.traceId,
      userId: context?.userId,
      tenantId: context?.tenantId,
      organizationId: context?.organizationId,
      ...meta,
    };
  }

  info(message: string, meta?: LoggerMetadata): void {
    this.logger.info(this.buildMeta(meta), message);
  }

  warn(message: string, meta?: LoggerMetadata): void {
    this.logger.warn(this.buildMeta(meta), message);
  }

  error(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.logger.error(
      this.buildMeta({
        error,
        ...meta,
      }),
      message,
    );
  }

  debug(message: string, meta?: LoggerMetadata): void {
    this.logger.debug(this.buildMeta(meta), message);
  }

  fatal(message: string, error?: unknown, meta?: LoggerMetadata): void {
    this.logger.fatal(
      this.buildMeta({
        error,
        ...meta,
      }),
      message,
    );
  }

  child(context: string): BaseLogger {
    return new PinoLogger({ context }, this.logger.child({ context }));
  }
}
