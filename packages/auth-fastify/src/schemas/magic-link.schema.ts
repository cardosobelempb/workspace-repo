// packages/auth-fastify/src/schemas/magic-link.schema.ts

import { z } from "zod";

export const RequestMagicLinkTokenSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const VerifyMagicLinkTokenQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type RequestMagicLinkTokenDto = z.infer<typeof RequestMagicLinkTokenSchema>;
export type VerifyMagicLinkTokenQueryDto = z.infer<
  typeof VerifyMagicLinkTokenQuerySchema
>;
