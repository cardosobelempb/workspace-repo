import { createEnv, nodeEnvSchema } from "@repo/common";
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_APP_NAME: z.string().default("Hotspot Web"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4949"),
});

export const env = createEnv(envSchema, { context: "frontend" });
export type Env = z.infer<typeof envSchema>;
