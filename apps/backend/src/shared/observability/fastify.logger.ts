import { BaseLogger } from "@repo/logger";
import type { LogContext } from "@repo/logger";
import type { FastifyBaseLogger, FastifyRequest } from "fastify";

/**
 * Adapter que envolve o `FastifyBaseLogger` (pino interno do Fastify) e o expõe
 * como `BaseLogger`, permitindo reutilizar a mesma interface em toda a aplicação.
 *
 * Por que adaptar em vez de usar o logger do Fastify diretamente?
 * O Fastify expõe `request.log` como `FastifyBaseLogger` — tipo acoplado ao framework.
 * Este adapter isola esse detalhe: o restante da aplicação depende apenas de `ILogger`.
 */
export class FastifyLoggerAdapter extends BaseLogger {
  constructor(
    private readonly loggerInstance: FastifyBaseLogger,
    bindings: LogContext = {},
  ) {
    super(bindings);
  }

  trace(message: string, context?: LogContext): void {
    this.loggerInstance.trace({ ...this.bindings, ...context }, message);
  }

  debug(message: string, context?: LogContext): void {
    this.loggerInstance.debug({ ...this.bindings, ...context }, message);
  }

  info(message: string, context?: LogContext): void {
    this.loggerInstance.info({ ...this.bindings, ...context }, message);
  }

  warn(message: string, context?: LogContext): void {
    this.loggerInstance.warn({ ...this.bindings, ...context }, message);
  }

  error(message: string, context?: LogContext | Error): void {
    this.loggerInstance.error(
      { ...this.bindings, ...this.normalizeError(context) },
      message,
    );
  }

  fatal(message: string, context?: LogContext | Error): void {
    this.loggerInstance.fatal(
      { ...this.bindings, ...this.normalizeError(context) },
      message,
    );
  }

  child(bindings: LogContext): FastifyLoggerAdapter {
    return new FastifyLoggerAdapter(
      this.loggerInstance.child(bindings),
      { ...this.bindings, ...bindings },
    );
  }

  static fromRequest(request: FastifyRequest, bindings: LogContext = {}): FastifyLoggerAdapter {
    return new FastifyLoggerAdapter(request.log, bindings);
  }
}
