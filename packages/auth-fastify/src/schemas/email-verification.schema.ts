// packages/auth-fastify/src/schemas/email-verification.schema.ts

import { z } from "zod";

export const RequestEmailVerificationTokenSchema = z.object({}).optional();

export const VerifyEmailVerificationTokenQuerySchema = z.object({
  token: z.string().min(20, "Token inválido"),
});

export type VerifyEmailQueryDto = z.infer<typeof VerifyEmailVerificationTokenQuerySchema>;
export type RequestEmailVerificationTokenDto = z.infer<
  typeof RequestEmailVerificationTokenSchema
>;
