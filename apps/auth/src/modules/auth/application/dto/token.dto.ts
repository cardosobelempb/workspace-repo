// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  CreateTokenSchema,
  TokenActivateResponseSchema,
  TokenCreateResponseSchema,
  TokenDeactivateResponseSchema,
  TokenFindByIdResponseSchema,
  TokenProjectionSchema,
  TokenResponseSchema,
  TokenSchema,
  TokenUpdateResponseSchema,
  UpdateTokenSchema,
} from "../../infrastructure/http/schemas/token.schema";

export type TokenDto = z.infer<typeof TokenSchema>;
export type CreateTokenDto = z.infer<typeof CreateTokenSchema>;
export type UpdateTokenDto = z.infer<typeof UpdateTokenSchema>;
export type TokenProjectionDto = z.infer<typeof TokenProjectionSchema>;
export type TokenResponseDto = z.infer<typeof TokenResponseSchema>;
export type TokenCreateResponseDto = z.infer<typeof TokenCreateResponseSchema>;
export type TokenFindByIdResponseDto = z.infer<typeof TokenFindByIdResponseSchema>;
export type TokenUpdateResponseDto = z.infer<typeof TokenUpdateResponseSchema>;
export type TokenActivateResponseDto = z.infer<typeof TokenActivateResponseSchema>;
export type TokenDeactivateResponseDto = z.infer<typeof TokenDeactivateResponseSchema>;
