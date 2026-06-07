// packages/auth-fastify/src/schemas/magic-link.schema.ts

import { z } from "zod";

export const RequestMagicLinkSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const VerifyMagicLinkQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type RequestMagicLinkDto = z.infer<typeof RequestMagicLinkSchema>;
export type VerifyMagicLinkQueryDto = z.infer<typeof VerifyMagicLinkQuerySchema>;
