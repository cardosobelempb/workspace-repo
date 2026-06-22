import { ConsoleLogger } from "./adapters/console.logger";
import { Logger } from "./logger";
import type { ILogger } from "./types/i-logger";
import type { LogContext } from "./types/log-context";
import type { LoggerOptions } from "./types/logger-options";

/**
 * Factory central para instanciar loggers em toda a aplicação.
 *
 * Estratégia automática por ambiente:
 * - development / test → ConsoleLogger (sem dependência de pino-pretty)
 * - production / staging → Logger com PinoDriver (JSON estruturado)
 *
 * Use `LoggerFactory.create("nome-do-modulo")` como ponto de entrada
 * padrão em controllers, use-cases, workers e qualquer entry-point.
 */
export class LoggerFactory {
  static create(context: string, overrides?: Partial<Omit<LoggerOptions, "driver">>): ILogger {
    const environment =
      (process.env.NODE_ENV as LoggerOptions["environment"]) ?? "development";

    const isStructured = environment === "production" || environment === "staging";

    if (!isStructured) {
      return new ConsoleLogger({ context });
    }

    const options: LoggerOptions = {
      serviceName: process.env.SERVICE_NAME ?? "app",
      environment,
      level: (process.env.LOG_LEVEL as LoggerOptions["level"]) ?? "info",
      ...overrides,
    };

    return new Logger(options).child({ context });
  }

  static createWithOptions(options: LoggerOptions): Logger {
    return new Logger(options);
  }

  static createConsole(bindings?: LogContext): ILogger {
    return new ConsoleLogger(bindings);
  }
}
