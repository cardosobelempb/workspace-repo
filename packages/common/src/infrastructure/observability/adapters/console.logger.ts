import { BaseLogger } from "../base-logger";
import { LoggerMetadata } from "../logger.types";

export class ConsoleLogger extends BaseLogger {
  info(message: string, meta?: LoggerMetadata): void {
    console.log("[INFO]", this.context, message, meta ?? "");
  }

  warn(message: string, meta?: LoggerMetadata): void {
    console.warn("[WARN]", this.context, message, meta ?? "");
  }

  error(message: string, error?: unknown, meta?: LoggerMetadata): void {
    console.error("[ERROR]", this.context, message, {
      error,
      ...meta,
    });
  }

  debug(message: string, meta?: LoggerMetadata): void {
    console.debug("[DEBUG]", this.context, message, meta ?? "");
  }

  fatal(message: string, error?: unknown, meta?: LoggerMetadata): void {
    console.error("[FATAL]", this.context, message, {
      error,
      ...meta,
    });
  }

  child(context: string): BaseLogger {
    return new ConsoleLogger({
      context,
    });
  }
}
