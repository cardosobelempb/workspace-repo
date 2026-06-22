import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import type { ILogger } from "@repo/logger";

import { envDatabase } from "../config/env-database.js";
import { attachPrismaLogger } from "../observability/prisma.logger";

export type PrismaDatabase = PrismaClient<
  Prisma.PrismaClientOptions,
  "query" | "info" | "warn" | "error"
>;

declare global {
  var __prisma: PrismaDatabase | undefined;
}

export type PrismaFactoryOptions = {
  logger?: ILogger;
};

function buildPrismaClient(options: PrismaFactoryOptions = {}): PrismaDatabase {
  const connectionString = envDatabase.DATABASE_URL;

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "info",  emit: "event" },
      { level: "warn",  emit: "event" },
      { level: "error", emit: "event" },
    ],
  }) as PrismaDatabase;

  if (options.logger) {
    attachPrismaLogger(prisma, { logger: options.logger });
  }

  return prisma;
}

export function getPrismaClient(options: PrismaFactoryOptions = {}): PrismaDatabase {
  if (envDatabase.NODE_ENV !== "production") {
    if (!globalThis.__prisma) {
      globalThis.__prisma = buildPrismaClient(options);
    }

    return globalThis.__prisma;
  }

  return buildPrismaClient(options);
}
