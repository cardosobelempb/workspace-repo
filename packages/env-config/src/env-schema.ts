import { z } from "zod";

import { createEnv } from "./create-env";
import { logLevelSchema, nodeEnvSchema, parseEnvArray } from "./env-helpers.schema";
import { EnvValidationError } from "./env-validation.error";
import { loadProjectEnv } from "./load-project-env";

loadProjectEnv();

export const envSchema = z.object({
  // App configuration
  TITLE: z.string().default("Hotspot API"),
  DESCRIPTION: z.string().default("API para gerenciamento de hotspots Wi-Fi"),
  VERSION: z.string().default("1.0.0"),
  NODE_ENV: nodeEnvSchema,
  PORT: z.coerce.number().default(4949),
  HOST: z.string().default("127.0.0.1"),
  PUBLIC_HOST: z.string().default("localhost"),
  LOG_LEVEL: logLevelSchema,
  ORGANIZATION_NAME: z.string().default("Hotspot Inc."),
  CORS_ORIGINS: z.string().transform(parseEnvArray),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  // POSTGRES_USER: z
  //   .string()
  //   .min(1, "POSTGRES_USER é obrigatório")
  //   .default("postgres"),
  // POSTGRES_PASSWORD: z
  //   .string()
  //   .min(1, "POSTGRES_PASSWORD é obrigatório")
  //   .default("docker"),
  // POSTGRES_DB: z
  //   .string()
  //   .min(1, "POSTGRES_DB é obrigatório")
  //   .default("hotspot"),

  // JWT
  JWT_ACCESS_TOKEN_SECRET: z.string().min(1, "JWT_REFRESH_SECRET é obrigatória"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(1),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1, "JWT_REFRESH_SECRET é obrigatória")
    .default(process.env.JWT_REFRESH_TOKEN_SECRET ?? ""),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(1),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(1, "ACCESS_TOKEN_SECRET_KEY é obrigatória")
    .default(process.env.JWT_ACCESS_TOKEN_SECRET ?? ""),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(1, "REFRESH_TOKEN_SECRET_KEY é obrigatória")
    .default(process.env.JWT_REFRESH_TOKEN_SECRET ?? process.env.JWT_REFRESH_SECRET ?? ""),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(15 * 60), // 15 minutos
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(7 * 24 * 60 * 60), // 7 dias

  // Cookie
  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET é obrigatória"),
});

export const env = createEnv(envSchema, {
  context: "common.infrastructure.env",
  onError: (issues) => {
    const error = new EnvValidationError("process.env");

    issues.forEach((issue) => {
      error.addFieldError(issue.field, issue.message);
    });

    console.error(error.toJSON());
  },
});
export type Env = z.infer<typeof envSchema>;
