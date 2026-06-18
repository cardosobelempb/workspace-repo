// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  CreateOtpCodeSchema,
  OtpCodeActivateResponseSchema,
  OtpCodeCreateResponseSchema,
  OtpCodeDeactivateResponseSchema,
  OtpCodeFindByIdResponseSchema,
  OtpCodeProjectionSchema,
  OtpCodeResponseSchema,
  OtpCodeSchema,
  OtpCodeUpdateResponseSchema,
  UpdateOtpCodeSchema,
} from "../../infrastructure/http/schemas/otp-code.schema";

export type OtpCodeDto = z.infer<typeof OtpCodeSchema>;
export type CreateOtpCodeDto = z.infer<typeof CreateOtpCodeSchema>;
export type UpdateOtpCodeDto = z.infer<typeof UpdateOtpCodeSchema>;
export type OtpCodeProjectionDto = z.infer<typeof OtpCodeProjectionSchema>;
export type OtpCodeResponseDto = z.infer<typeof OtpCodeResponseSchema>;
export type OtpCodeCreateResponseDto = z.infer<typeof OtpCodeCreateResponseSchema>;
export type OtpCodeFindByIdResponseDto = z.infer<typeof OtpCodeFindByIdResponseSchema>;
export type OtpCodeUpdateResponseDto = z.infer<typeof OtpCodeUpdateResponseSchema>;
export type OtpCodeActivateResponseDto = z.infer<typeof OtpCodeActivateResponseSchema>;
export type OtpCodeDeactivateResponseDto = z.infer<
  typeof OtpCodeDeactivateResponseSchema
>;
