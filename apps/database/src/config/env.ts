import { createEnv, logLevelSchema, nodeEnvSchema } from "@repo/env-config";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  LOG_LEVEL: logLevelSchema,
});

export const env = createEnv(envSchema, { context: "database" });
export type Env = z.infer<typeof envSchema>;
