import { createEnv, logLevelSchema, nodeEnvSchema } from "@repo/env-config";
import { z } from "zod";

export const envDatabaseSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  LOG_LEVEL: logLevelSchema,
});

export const envDatabase = createEnv(envDatabaseSchema, { context: "database" });
export type EnvDatabase = z.infer<typeof envDatabaseSchema>;
