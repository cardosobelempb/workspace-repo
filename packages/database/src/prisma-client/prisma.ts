// ============================================================
// shared/database/prisma.ts
// Prisma singleton.
// ============================================================

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

import { BaseLogger } from "@repo/common";
import { envDatabase } from "../config/env-database.js";
import { PrismaLoggerAdapter } from "../observability/prisma.logger";

// ============================================================
// Tipos
// ============================================================

export type PrismaDatabase = PrismaClient<
  Prisma.PrismaClientOptions,
  "query" | "info" | "warn" | "error"
>;

// ============================================================
// Global
// ============================================================

declare global {
  var __prisma: PrismaDatabase | undefined;
}

// ============================================================
// Options
// ============================================================

type PrismaFactoryOptions = {
  logger?: BaseLogger;
};

// ============================================================
// Factory
// ============================================================

function buildPrismaClient(options: PrismaFactoryOptions = {}): PrismaDatabase {
  const connectionString = envDatabase.DATABASE_URL;

  const adapter = new PrismaPg({
    connectionString,
  });

  // ==========================================================
  // Prisma Client
  // ==========================================================

  const prisma = new PrismaClient({
    adapter,

    log: [
      {
        level: "query",
        emit: "event",
      },
      {
        level: "info",
        emit: "event",
      },
      {
        level: "warn",
        emit: "event",
      },
      {
        level: "error",
        emit: "event",
      },
    ],
  }) as PrismaDatabase;

  // ==========================================================
  // Prisma Logger Adapter
  // ==========================================================

  if (options.logger) {
    const prismaLogger = new PrismaLoggerAdapter(prisma, options.logger);

    prismaLogger.register();
  }

  return prisma;
}

// ============================================================
// Singleton
// ============================================================

export function getPrismaClient(options: PrismaFactoryOptions = {}): PrismaDatabase {
  if (envDatabase.NODE_ENV !== "production") {
    if (!globalThis.__prisma) {
      globalThis.__prisma = buildPrismaClient(options);
    }

    return globalThis.__prisma;
  }

  return buildPrismaClient(options);
}
