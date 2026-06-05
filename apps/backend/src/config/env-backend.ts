import {
  createEnv,
  loadProjectEnv,
  logLevelSchema,
  nodeEnvSchema,
  parseEnvArray,
} from "@repo/env-config";
import { z } from "zod";

loadProjectEnv();

export const envBackendSchema = z.object({
  TITLE: z.string().default("Hotspot API"),
  DESCRIPTION: z.string().default("API para gerenciamento de hotspots Wi-Fi"),
  VERSION: z.string().default("1.0.0"),
  NODE_ENV: nodeEnvSchema,
  PORT: z.coerce.number().default(Number(process.env.BACKEND_PORT ?? 4949)),
  HOST: z.string().default("127.0.0.1"),
  PUBLIC_HOST: z.string().default("localhost"),
  LOG_LEVEL: logLevelSchema,
  ORGANIZATION_NAME: z.string().default("Hotspot Inc."),
  CORS_ORIGINS: z.string().transform(parseEnvArray),
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(1, "JWT_ACCESS_TOKEN_SECRET e obrigatoria"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(1),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1, "JWT_REFRESH_SECRET e obrigatoria")
    .default(process.env.JWT_REFRESH_TOKEN_SECRET ?? ""),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(1),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(1, "ACCESS_TOKEN_SECRET e obrigatoria")
    .default(process.env.JWT_ACCESS_TOKEN_SECRET ?? ""),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(1, "REFRESH_TOKEN_SECRET e obrigatoria")
    .default(
      process.env.JWT_REFRESH_TOKEN_SECRET ?? process.env.JWT_REFRESH_SECRET ?? "",
    ),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(15 * 60),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(7 * 24 * 60 * 60),
  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET e obrigatoria"),
});

export const envBackend = createEnv(envBackendSchema, { context: "backend" });
export type EnvBackend = z.infer<typeof envBackendSchema>;
