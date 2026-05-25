// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  CreateOtpSchema,
  OtpActivateResponseSchema,
  OtpCreateResponseSchema,
  OtpDeactivateResponseSchema,
  OtpFindByIdResponseSchema,
  OtpProjectionSchema,
  OtpResponseSchema,
  OtpSchema,
  OtpUpdateResponseSchema,
  UpdateOtpSchema,
} from "../../infrastructure/http/schemas/otp.schema";

export type OtpDto = z.infer<typeof OtpSchema>;
export type CreateOtpDto = z.infer<typeof CreateOtpSchema>;
export type UpdateOtpDto = z.infer<typeof UpdateOtpSchema>;
export type OtpProjectionDto = z.infer<typeof OtpProjectionSchema>;
export type OtpResponseDto = z.infer<typeof OtpResponseSchema>;
export type OtpCreateResponseDto = z.infer<typeof OtpCreateResponseSchema>;
export type OtpFindByIdResponseDto = z.infer<typeof OtpFindByIdResponseSchema>;
export type OtpUpdateResponseDto = z.infer<typeof OtpUpdateResponseSchema>;
export type OtpActivateResponseDto = z.infer<typeof OtpActivateResponseSchema>;
export type OtpDeactivateResponseDto = z.infer<typeof OtpDeactivateResponseSchema>;
