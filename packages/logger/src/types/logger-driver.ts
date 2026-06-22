import { LogContext } from "./log-context";
import { LogLevel } from "./log-level";

/** Cada implementação concreta (pino, console, etc.) deve satisfazer esta interface. */
export interface LoggerDriver {
  log(level: LogLevel, message: string, context?: LogContext): void;
  child(bindings: LogContext): LoggerDriver;
  flush?(): Promise<void>;
}
