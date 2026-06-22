export * from "./base-logger";
export * from "./context";
export * from "./drivers";
export * from "./logger";
export * from "./logger-factory";
export * from "./adapters";
export * from "./types";

// Alias de compatibilidade: LoggerMetadata === LogContext
export type { LogContext as LoggerMetadata } from "./types/log-context";
