import { ILogger } from "@repo/logger";

interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface PrismaLogEvent {
  message: string;
  target: string;
}

/**
 * Subconjunto da API do PrismaClient que este adapter precisa.
 *
 * Usamos `(event: unknown) => void` nos callbacks para que `PrismaDatabase`
 * (cuja assinatura de `$on` é genérica com tipo condicional) seja estruturalmente
 * compatível sem cast. Os campos específicos são acessados via cast interno nos
 * callbacks de `attachPrismaLogger` — seguro pois o Prisma sempre emite os campos
 * documentados em `PrismaQueryEvent` / `PrismaLogEvent`.
 *
 * Tipamos manualmente para não criar dependência direta de `@prisma/client`
 * neste package (peer dependency).
 */
export interface PrismaClientLike {
  $on(event: "query", callback: (event: unknown) => void): void;
  $on(event: "warn" | "info" | "error", callback: (event: unknown) => void): void;
}

export interface PrismaLoggerOptions {
  logger: ILogger;
  /** Loga cada query SQL executada. Útil em dev; recomenda-se desligar em produção (alto volume). */
  logQueries?: boolean;
  /** Acima deste tempo (ms), a query é logada como `warn` — ajuda a achar queries lentas. */
  slowQueryThresholdMs?: number;
}

/**
 * Adapter orientado a objeto para wiring do Prisma com o logger.
 * Útil quando o código consumidor prefere instanciar uma classe e chamar `.register()`.
 */
export class PrismaLoggerAdapter {
  constructor(
    private readonly prisma: PrismaClientLike,
    private readonly logger: ILogger,
    private readonly options: Omit<PrismaLoggerOptions, "logger"> = {},
  ) {}

  register(): void {
    attachPrismaLogger(this.prisma, { logger: this.logger, ...this.options });
  }
}

export function attachPrismaLogger(
  prisma: PrismaClientLike,
  options: PrismaLoggerOptions,
): void {
  const { logger, logQueries = false, slowQueryThresholdMs = 200 } = options;
  const prismaLogger = logger.child({ source: "prisma" });

  if (logQueries) {
    prisma.$on("query", (raw) => {
      const event = raw as PrismaQueryEvent;
      const isSlow = event.duration >= slowQueryThresholdMs;
      const context = {
        query: event.query,
        params: event.params,
        durationMs: event.duration,
      };

      if (isSlow) {
        prismaLogger.warn("Query lenta detectada", context);
      } else {
        prismaLogger.debug("Query executada", context);
      }
    });
  }

  prisma.$on("warn", (raw) => {
    const event = raw as PrismaLogEvent;
    prismaLogger.warn(event.message, { target: event.target });
  });

  prisma.$on("error", (raw) => {
    const event = raw as PrismaLogEvent;
    prismaLogger.error(event.message, { target: event.target });
  });
}
