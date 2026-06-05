import { ConsoleLogger } from "./adapters/console.logger";
import { PinoLogger } from "./adapters/pino.logger";
import { BaseLogger } from "./base-logger";

// ============================================================
// Factory central do Logger
//
// Decide automaticamente:
// - DEV -> Console/Pino Pretty
// - PROD -> Pino JSON
// ============================================================

export class LoggerFactory {
  static create(context?: string): BaseLogger {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      return new PinoLogger({
        context,
      });
    }

    return new ConsoleLogger({
      context,
    });
  }
}
