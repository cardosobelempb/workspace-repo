// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  AuthActivateResponseSchema,
  AuthCreateResponseSchema,
  AuthDeactivateResponseSchema,
  AuthFindByIdResponseSchema,
  AuthProjectionSchema,
  AuthResponseSchema,
  AuthSchema,
  AuthUpdateResponseSchema,
  CreateAuthSchema,
  UpdateAuthSchema,
} from "../../infrastructure/http/schemas/auth.schema";

export type AuthDto = z.infer<typeof AuthSchema>;
export type CreateAuthDto = z.infer<typeof CreateAuthSchema>;
export type UpdateAuthDto = z.infer<typeof UpdateAuthSchema>;
export type AuthProjectionDto = z.infer<typeof AuthProjectionSchema>;
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
export type AuthCreateResponseDto = z.infer<typeof AuthCreateResponseSchema>;
export type AuthFindByIdResponseDto = z.infer<typeof AuthFindByIdResponseSchema>;
export type AuthUpdateResponseDto = z.infer<typeof AuthUpdateResponseSchema>;
export type AuthActivateResponseDto = z.infer<typeof AuthActivateResponseSchema>;
export type AuthDeactivateResponseDto = z.infer<typeof AuthDeactivateResponseSchema>;
