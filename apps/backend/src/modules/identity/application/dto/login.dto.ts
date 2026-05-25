// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  CreateLoginSchema,
  LoginActivateResponseSchema,
  LoginCreateResponseSchema,
  LoginDeactivateResponseSchema,
  LoginFindByIdResponseSchema,
  LoginProjectionSchema,
  LoginResponseSchema,
  LoginSchema,
  LoginUpdateResponseSchema,
  UpdateLoginSchema,
} from "../../infrastructure/http/schemas/login.schema";

export type LoginDto = z.infer<typeof LoginSchema>;
export type CreateLoginDto = z.infer<typeof CreateLoginSchema>;
export type UpdateLoginDto = z.infer<typeof UpdateLoginSchema>;
export type LoginProjectionDto = z.infer<typeof LoginProjectionSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
export type LoginCreateResponseDto = z.infer<typeof LoginCreateResponseSchema>;
export type LoginFindByIdResponseDto = z.infer<typeof LoginFindByIdResponseSchema>;
export type LoginUpdateResponseDto = z.infer<typeof LoginUpdateResponseSchema>;
export type LoginActivateResponseDto = z.infer<typeof LoginActivateResponseSchema>;
export type LoginDeactivateResponseDto = z.infer<typeof LoginDeactivateResponseSchema>;
