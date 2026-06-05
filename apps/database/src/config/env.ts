import { createEnv, logLevelSchema, nodeEnvSchema } from "@repo/env-config";
import { z } from "zod";

export const envPrismaSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  LOG_LEVEL: logLevelSchema,
});

export const envPrisma = createEnv(envPrismaSchema, { context: "database" });
export type EnvPrisma = z.infer<typeof envPrismaSchema>;
