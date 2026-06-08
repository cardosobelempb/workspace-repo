// packages/auth-fastify/src/schemas/otp.schema.ts

import { z } from "zod";

export const RequestOtpCodeSchema = z.object({
  email: z.string().email("E-mail inválido"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("LOGIN"),
});

export const ValidateOtpCodeSchema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve conter exatamente 6 dígitos"),
  purpose: z.enum(["LOGIN", "EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("LOGIN"),
});

export type RequestOtpCodeDto = z.infer<typeof RequestOtpCodeSchema>;
export type ValidateOtpCodeDto = z.infer<typeof ValidateOtpCodeSchema>;
