// ============================================================
// Session.schema.ts
// Schemas exclusivos da entidade Session.
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

export const SessionParamsSchema = z.object({
  sessionId: UuidSchema,
});

export type SessionParams = z.infer<typeof SessionParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const SessionSchema = z
  .object({
    email: s.email,
    passwordHash: s.password,
    tenantId: UuidSchema,
    organizationId: UuidSchema,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateSessionSchema = SessionSchema.omit({});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do SessionSchema base
export const UpdateSessionSchema = SessionSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const SessionResponseSchema = SessionSchema.omit({
  email: true,
  passwordHash: true,
}).extend({
  sessionToken: z.string(),
  expiresAt: s.date,
  user: z.object({
    id: UuidSchema,
    email: s.email,
  }),
  role: s.string,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const SessionProjectionSchema = SessionSchema.pick({
  tenantId: true,
  organizationId: true,
}).extend({
  sessionToken: z.string(),
  expiresAt: s.date,
  user: z.object({
    id: UuidSchema,
    email: s.email,
  }),
  role: s.string,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa SessionResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const SessionCreateResponseSchema = createResponseSchema(SessionResponseSchema);
export const SessionFindByIdResponseSchema = findResponseSchema(SessionResponseSchema);
export const SessionUpdateResponseSchema = updateResponseSchema(SessionResponseSchema);
export const SessionActivateResponseSchema = actionResponseSchema();
export const SessionDeactivateResponseSchema = actionResponseSchema();
export const SessionProjectionResponseSchema = pageResponseSchema(
  SessionProjectionSchema,
);
