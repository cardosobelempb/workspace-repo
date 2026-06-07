// packages/auth-fastify/src/schemas/oauth.schema.ts

import { z } from "zod";

export const OAuthCallbackQuerySchema = z.object({
  code: z.string().min(1, "Code OAuth obrigatório"),
  state: z.string().min(1, "State OAuth obrigatório"),
});

export type OAuthCallbackQueryDto = z.infer<typeof OAuthCallbackQuerySchema>;
