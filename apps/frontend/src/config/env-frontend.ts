import { s } from "@repo/common";
import {
  createEnv,
  loadProjectEnv,
  nodeEnvSchema,
  parseEnvArray,
} from "@repo/env-config";
import { z } from "zod";

loadProjectEnv();

export const envFrontendSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_APP_NAME: s.string.default("SURB Serviços Urbanos"),
  NEXT_PUBLIC_API_URL: s.url.default("http://localhost:4949"),
  NEXT_PUBLIC_APP_URL: s.url.default("http://localhost:3000"),
  SHORT_NAME: s.string.default("SURB"),
  DESCRIPTION: s.description.default(
    "Sistema moderno para serviços urbanos com delivery, biolink, agendamento, vitrine digital e automação comercial.",
  ),
  BASE_URL: s.url.default("https://surb.com.br"),
  WHATSAPPs: s.phone.default("5583999999999"),
  CONTACT_EMAIL: s.email.default("contato@surb.com.br"),
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
    .default(process.env.JWT_REFRESH_TOKEN_SECRET ?? process.env.JWT_REFRESH_SECRET ?? ""),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().default(15 * 60),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(7 * 24 * 60 * 60),
  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET e obrigatoria"),
});

export const envFrontend = createEnv(envFrontendSchema, { context: "frontend" });
export type EnvFrontend = z.infer<typeof envFrontendSchema>;
