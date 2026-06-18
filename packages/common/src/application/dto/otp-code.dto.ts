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

export type OtpDto = z.infer<typeof OtpCodeSchema>;
export type CreateOtpDto = z.infer<typeof CreateOtpCodeSchema>;
export type UpdateOtpDto = z.infer<typeof UpdateOtpCodeSchema>;
export type OtpProjectionDto = z.infer<typeof OtpCodeProjectionSchema>;
export type OtpResponseDto = z.infer<typeof OtpCodeResponseSchema>;
export type OtpCreateResponseDto = z.infer<typeof OtpCodeCreateResponseSchema>;
export type OtpFindByIdResponseDto = z.infer<typeof OtpCodeFindByIdResponseSchema>;
export type OtpUpdateResponseDto = z.infer<typeof OtpCodeUpdateResponseSchema>;
export type OtpActivateResponseDto = z.infer<typeof OtpCodeActivateResponseSchema>;
export type OtpDeactivateResponseDto = z.infer<typeof OtpCodeDeactivateResponseSchema>;
