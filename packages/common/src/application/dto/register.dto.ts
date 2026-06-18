// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import z from "zod";
import {
  RegisterBodySchema,
  RegisterProjectionSchema,
  RegisterSchema,
} from "../../infrastructure/http/schemas/register.schema";

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type RegisterProjectionDto = z.infer<typeof RegisterProjectionSchema>;
export type RegisterBodyDto = z.infer<typeof RegisterBodySchema>;
