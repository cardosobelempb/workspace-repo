// packages/auth-fastify/src/schemas/email-verification.schema.ts

import { z } from "zod";

export const RequestEmailVerificationSchema = z.object({}).optional();

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type VerifyEmailQueryDto = z.infer<typeof VerifyEmailQuerySchema>;
export type RequestEmailVerificationDto = z.infer<typeof RequestEmailVerificationSchema>;
