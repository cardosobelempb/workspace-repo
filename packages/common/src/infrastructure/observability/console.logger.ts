import { BaseLogger } from "./base-logger.abstract";
import { BaseLogMeta } from "./types/base-log-meta.type";

export interface IConsoleLogger {
  debug(meta: BaseLogMeta, msg?: string): void;
  info(meta: BaseLogMeta, msg?: string): void;
  warn(meta: BaseLogMeta, msg?: string): void;
  error(meta: BaseLogMeta, msg?: string): void;
}

export class ConsoleLogger extends BaseLogger {
  debug(meta: BaseLogMeta, msg = ""): void {
    // em prod você pode desabilitar debug pelo env
    if (process.env.LOG_LEVEL === "debug") console.debug(msg, meta);
  }
  info(meta: BaseLogMeta, msg = ""): void {
    console.info(msg, meta);
  }
  warn(meta: BaseLogMeta, msg = ""): void {
    console.warn(msg, meta);
  }
  error(meta: BaseLogMeta, msg = ""): void {
    console.error(msg, meta);
  }
}

export function buildLogger(): IConsoleLogger {
  return new ConsoleLogger();
}

/**
 * Adapter opcional: usa o logger do Fastify como Logger comum.
 */
export function buildClient(logger: BaseLogger): IConsoleLogger {
  return {
    debug: (meta, msg) => logger.debug(meta, msg),
    info: (meta, msg) => logger.info(meta, msg),
    warn: (meta, msg) => logger.warn(meta, msg),
    error: (meta, msg) => logger.error(meta, msg),
  };
}
