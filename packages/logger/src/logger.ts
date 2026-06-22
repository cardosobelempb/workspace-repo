import { BaseLogger } from "./base-logger";
import { PinoDriver } from "./drivers/pino-driver";
import type { ILogger } from "./types/i-logger";
import type { LogContext } from "./types/log-context";
import type { LoggerDriver } from "./types/logger-driver";
import type { LoggerOptions } from "./types/logger-options";

/**
 * Implementação concreta de `BaseLogger` usando o padrão Driver.
 *
 * Não conhece Fastify, NestJS ou Prisma — Single Responsibility Principle.
 * Os adapters (src/adapters) traduzem eventos desses frameworks em chamadas
 * a esta classe. O driver padrão é `PinoDriver` (mais rápido do ecossistema Node).
 */
export class Logger extends BaseLogger {
  private readonly driver: LoggerDriver;

  constructor(options: LoggerOptions) {
    super();
    this.driver = options.driver ?? new PinoDriver(options);
  }

  /** Caminho interno usado por `.child()` para reaproveitar driver já configurado. */
  private static fromDriver(driver: LoggerDriver): Logger {
    const logger = Object.create(Logger.prototype) as Logger;
    (logger as unknown as { driver: LoggerDriver }).driver = driver;
    return logger;
  }

  trace(message: string, context?: LogContext): void {
    this.driver.log("trace", message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.driver.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.driver.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.driver.log("warn", message, context);
  }

  error(message: string, context?: LogContext | Error): void {
    this.driver.log("error", message, this.normalizeError(context));
  }

  fatal(message: string, context?: LogContext | Error): void {
    this.driver.log("fatal", message, this.normalizeError(context));
  }

  child(bindings: LogContext): ILogger {
    return Logger.fromDriver(this.driver.child(bindings));
  }

  override async flush(): Promise<void> {
    await this.driver.flush?.();
  }
}

export function createLogger(options: LoggerOptions): ILogger {
  return new Logger(options);
}
