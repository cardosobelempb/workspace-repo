// ============================================================
// prisma.logger.ts
// Adapter de logs do Prisma.
// ============================================================

import { Prisma, PrismaClient } from "@prisma/client";
import { BaseLogger } from "@repo/common";

export type PrismaLogger = PrismaClient<
  Prisma.PrismaClientOptions,
  "query" | "info" | "warn" | "error"
>;

export class PrismaLoggerAdapter {
  constructor(
    private readonly prisma: PrismaLogger,
    private readonly logger: BaseLogger,
  ) {}

  register(): void {
    // ========================================================
    // QUERY
    // ========================================================

    this.prisma.$on("query", (event) => {
      this.logger.debug(
        {
          event: "PRISMA_QUERY",
          context: "database",

          query: event.query,

          params: process.env.NODE_ENV === "development" ? event.params : "[FILTERED]",

          duration: `${event.duration}ms`,
          target: event.target,
        },
        "Prisma query executed",
      );
    });

    // ========================================================
    // INFO
    // ========================================================

    this.prisma.$on("info", (event) => {
      this.logger.info(
        {
          event: "PRISMA_INFO",
          context: "database",

          message: event.message,
          target: event.target,
        },
        "Prisma info",
      );
    });

    // ========================================================
    // WARN
    // ========================================================

    this.prisma.$on("warn", (event) => {
      this.logger.warn(
        {
          event: "PRISMA_WARN",
          context: "database",

          message: event.message,
          target: event.target,
        },
        "Prisma warning",
      );
    });

    // ========================================================
    // ERROR
    // ========================================================

    this.prisma.$on("error", (event) => {
      this.logger.error(
        {
          event: "PRISMA_ERROR",
          context: "database",

          message: event.message,
          target: event.target,
        },
        "Prisma error",
      );
    });
  }
}
