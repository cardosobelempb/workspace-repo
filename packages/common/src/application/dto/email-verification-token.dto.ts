// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import {
  EmailVerificationTokenActivateResponseSchema,
  EmailVerificationTokenCreateResponseSchema,
  EmailVerificationTokenDeactivateResponseSchema,
  EmailVerificationTokenFindByIdResponseSchema,
  EmailVerificationTokenProjectionSchema,
  EmailVerificationTokenResponseSchema,
  EmailVerificationTokenSchema,
  EmailVerificationTokenUpdateResponseSchema,
} from "@/common/infrastructure/http/schemas/email-verification-token.schema";
import z from "zod";

export type EmailVerificationTokenDto = z.infer<typeof EmailVerificationTokenSchema>;
export type EmailVerificationTokenProjectionDto = z.infer<
  typeof EmailVerificationTokenProjectionSchema
>;
export type EmailVerificationTokenResponseDto = z.infer<
  typeof EmailVerificationTokenResponseSchema
>;
export type EmailVerificationTokenCreateResponseDto = z.infer<
  typeof EmailVerificationTokenCreateResponseSchema
>;
export type EmailVerificationTokenFindByIdResponseDto = z.infer<
  typeof EmailVerificationTokenFindByIdResponseSchema
>;
export type EmailVerificationTokenUpdateResponseDto = z.infer<
  typeof EmailVerificationTokenUpdateResponseSchema
>;
export type EmailVerificationTokenActivateResponseDto = z.infer<
  typeof EmailVerificationTokenActivateResponseSchema
>;
export type EmailVerificationTokenDeactivateResponseDto = z.infer<
  typeof EmailVerificationTokenDeactivateResponseSchema
>;
