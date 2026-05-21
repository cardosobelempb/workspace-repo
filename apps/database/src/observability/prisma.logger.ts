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
    this.prisma.$on("query", (event) => {
      this.logger.debug("Prisma Query", {
        query: event.query,
        params: event.params,
        duration: event.duration,
      });
    });

    this.prisma.$on("error", (event) => {
      this.logger.error("Prisma Error", event);
    });

    this.prisma.$on("warn", (event) => {
      this.logger.warn("Prisma Warning", {
        message: event.message,
      });
    });

    this.prisma.$on("info", (event) => {
      this.logger.info("Prisma Info", {
        message: event.message,
      });
    });
  }
}
