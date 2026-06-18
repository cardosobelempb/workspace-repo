// ============================================================
// Otp.schema.ts
// Schemas exclusivos da entidade Otp.
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

export const OtpCodeParamsSchema = z.object({
  otpId: UuidSchema,
});

export type OtpCodeParams = z.infer<typeof OtpCodeParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const OtpCodeSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema,
    phone: s.phone,
    codeHash: s.string,
    expiredAt: s.date,
    attempts: s.number,
    usedAt: s.nullableDate,
    createdAt: s.date,
    updatedAt: s.nullableDate,
    deletedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateOtpCodeSchema = OtpCodeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do OtpCodeSchema base
export const UpdateOtpCodeSchema = OtpCodeSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const OtpCodeResponseSchema = OtpCodeSchema.omit({
  deletedAt: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const OtpCodeProjectionSchema = OtpCodeSchema.pick({
  id: true,
  userId: true,
  phone: true,
  expiredAt: true,
  attempts: true,
  usedAt: true,
  createdAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa OtpCodeResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const OtpCodeCreateResponseSchema = createResponseSchema(OtpCodeResponseSchema);
export const OtpCodeFindByIdResponseSchema = findResponseSchema(OtpCodeResponseSchema);
export const OtpCodeUpdateResponseSchema = updateResponseSchema(OtpCodeResponseSchema);
export const OtpCodeActivateResponseSchema = actionResponseSchema();
export const OtpCodeDeactivateResponseSchema = actionResponseSchema();
export const OtpCodeProjectionResponseSchema = pageResponseSchema(
  OtpCodeProjectionSchema,
);
