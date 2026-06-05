// ============================================================
// VerificationToken.schema.ts
// Schemas exclusivos da entidade VerificationToken.
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

export const VerificationTokenParamsSchema = z.object({
  verificationtokenId: UuidSchema,
});

export type VerificationTokenParams = z.infer<typeof VerificationTokenParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const VerificationTokenSchema = z
  .object({
    id: UuidSchema,
    identifier: s.string,
    token: s.string,
    createdAt: s.date,
    expiredAt: s.date,
    usedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateVerificationTokenSchema = VerificationTokenSchema.omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do VerificationTokenSchema base
export const UpdateVerificationTokenSchema = VerificationTokenSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const VerificationTokenResponseSchema = VerificationTokenSchema.omit({
  id: true,
  token: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const VerificationTokenProjectionSchema = VerificationTokenSchema.pick({
  identifier: true,
  createdAt: true,
  expiredAt: true,
  usedAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa VerificationTokenResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const VerificationTokenCreateResponseSchema = createResponseSchema(
  VerificationTokenResponseSchema,
);
export const VerificationTokenFindByIdResponseSchema = findResponseSchema(
  VerificationTokenResponseSchema,
);
export const VerificationTokenUpdateResponseSchema = updateResponseSchema(
  VerificationTokenResponseSchema,
);
export const VerificationTokenActivateResponseSchema = actionResponseSchema();
export const VerificationTokenDeactivateResponseSchema = actionResponseSchema();
export const VerificationTokenProjectionResponseSchema = pageResponseSchema(
  VerificationTokenProjectionSchema,
);
