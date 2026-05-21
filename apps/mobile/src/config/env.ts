import { createEnv, logLevelSchema, nodeEnvSchema } from "@repo/common";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  LOG_LEVEL: logLevelSchema,
  EXPO_PUBLIC_APP_NAME: z.string().default("Hotspot Mobile"),
  EXPO_PUBLIC_API_URL: z.string().url().default("http://localhost:4949"),
});

export const env = createEnv(envSchema, { context: "mobile" });
export type Env = z.infer<typeof envSchema>;
