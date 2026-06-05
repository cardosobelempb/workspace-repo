// ============================================================
// Auth.schema.ts
// Schemas exclusivos da entidade Auth.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

import { UserProjectionSchema } from "@/modules/user/infrastructure/http/schemas/user.schema";
import {
  actionResponseSchema,
  createResponseSchema,
  findResponseSchema,
  pageResponseSchema,
  s,
  updateResponseSchema,
  UuidSchema,
} from "@repo/common";
import z from "zod";

// ─── Params ───────────────────────────────────────────────────────────────────

export const AuthParamsSchema = z.object({
  authId: UuidSchema,
});

export type AuthParams = z.infer<typeof AuthParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const AuthSchema = z
  .object({
    user: UserProjectionSchema,
    accessToken: s.string,
    refreshToken: s.string,
    expiresAt: s.date,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateAuthSchema = AuthSchema.omit({});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do AuthSchema base
export const UpdateAuthSchema = AuthSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const AuthResponseSchema = AuthSchema.omit({
  user: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const AuthProjectionSchema = AuthSchema.pick({
  user: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa AuthResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const AuthCreateResponseSchema = createResponseSchema(AuthResponseSchema);
export const AuthFindByIdResponseSchema = findResponseSchema(AuthResponseSchema);
export const AuthUpdateResponseSchema = updateResponseSchema(AuthResponseSchema);
export const AuthActivateResponseSchema = actionResponseSchema();
export const AuthDeactivateResponseSchema = actionResponseSchema();
export const AuthProjectionResponseSchema = pageResponseSchema(AuthProjectionSchema);
