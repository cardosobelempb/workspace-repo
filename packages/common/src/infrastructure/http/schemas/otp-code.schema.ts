// ============================================================
// Otp.schema.ts
// Schemas exclusivos da entidade Otp.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

import {
  actionResponseSchema,
  createResponseSchema,
  EmailSchema,
  findResponseSchema,
  IpAddressSchema,
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
    email: EmailSchema,
    codeHash: s.string,
    purpose: s.string,
    expiredAt: s.date,
    usedAt: s.nullableDate,
    attempts: s.number,
    maxAttempts: s.number,
    ipAddress: IpAddressSchema._zod,
    userAgent: s.string.nullable(),
    createdAt: s.date,
    deletedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateOtpCodeSchema = OtpCodeSchema.omit({
  id: true,
  usedAt: true,
  createdAt: true,
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
  email: true,
  purpose: true,
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
