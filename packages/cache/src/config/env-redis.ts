import { createEnv, nodeEnvSchema } from "@repo/env-config";
import { z } from "zod";

export const envRedisSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().default(""),
});

export const envRedis = createEnv(envRedisSchema, { context: "auth" });
export type EnvRedis = z.infer<typeof envRedisSchema>;
