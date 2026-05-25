// ============================================================
// Login.schema.ts
// Schemas exclusivos da entidade Login.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

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

export const LoginParamsSchema = z.object({
  loginId: UuidSchema,
});

export type LoginParams = z.infer<typeof LoginParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const LoginSchema = z
  .object({
    email: s.email,
    password: s.password,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateLoginSchema = LoginSchema.omit({});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do LoginSchema base
export const UpdateLoginSchema = LoginSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const LoginResponseSchema = LoginSchema.omit({
  email: true,
  password: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const LoginProjectionSchema = LoginSchema.pick({
  email: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa LoginResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const LoginCreateResponseSchema = createResponseSchema(LoginResponseSchema);
export const LoginFindByIdResponseSchema = findResponseSchema(LoginResponseSchema);
export const LoginUpdateResponseSchema = updateResponseSchema(LoginResponseSchema);
export const LoginActivateResponseSchema = actionResponseSchema();
export const LoginDeactivateResponseSchema = actionResponseSchema();
export const LoginProjectionResponseSchema = pageResponseSchema(LoginProjectionSchema);
