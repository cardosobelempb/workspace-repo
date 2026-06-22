import { LogContext } from "./log-context";

/**
 * Interface pública do Logger — é isso que os adapters (Fastify, NestJS, Prisma)
 * e o código de negócio consomem. Não dependemos da implementação (pino) diretamente,
 * apenas dessa abstração (Dependency Inversion Principle - SOLID).
 */
export interface ILogger {
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext | Error): void;
  fatal(message: string, context?: LogContext | Error): void;
  /**
   * Cria um logger "filho" com contexto fixo (ex: requestId).
   * Todo log feito a partir dele já vem com esses campos — evita repetição (DRY).
   */
  child(bindings: LogContext): ILogger;
  /** Garante que logs em buffer sejam escritos antes do processo encerrar (ex: serverless). */
  flush(): Promise<void>;
}
