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
} from "@/common/shared";
import z from "zod";

// ─── Params ───────────────────────────────────────────────────────────────────

export const EmailVerificationTokenParamsSchema = z.object({
  verificationtokenId: UuidSchema,
});

export type EmailVerificationTokenParams = z.infer<
  typeof EmailVerificationTokenParamsSchema
>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const EmailVerificationTokenSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema,
    tokenHash: s.string,
    createdAt: s.date,
    expiresAt: s.date,
    usedAt: s.nullableDate,
    deletedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const EmailCreateVerificationTokenSchema = EmailVerificationTokenSchema.omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do VerificationTokenSchema base
export const EmailUpdateVerificationTokenSchema = EmailVerificationTokenSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const EmailVerificationTokenResponseSchema = EmailVerificationTokenSchema.omit({
  id: true,
  tokenHash: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const EmailVerificationTokenProjectionSchema = EmailVerificationTokenSchema.pick({
  createdAt: true,
  expiresAt: true,
  usedAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa VerificationTokenResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const EmailVerificationTokenCreateResponseSchema = createResponseSchema(
  EmailVerificationTokenResponseSchema,
);
export const EmailVerificationTokenFindByIdResponseSchema = findResponseSchema(
  EmailVerificationTokenResponseSchema,
);
export const EmailVerificationTokenUpdateResponseSchema = updateResponseSchema(
  EmailVerificationTokenResponseSchema,
);
export const EmailVerificationTokenActivateResponseSchema = actionResponseSchema();
export const EmailVerificationTokenDeactivateResponseSchema = actionResponseSchema();
export const EmailVerificationTokenProjectionResponseSchema = pageResponseSchema(
  EmailVerificationTokenProjectionSchema,
);
