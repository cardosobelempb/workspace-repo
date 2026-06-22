// ============================================================
// User.schema.ts
// Schemas exclusivos da entidade User.
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

export const MagicLinkParamsSchema = z.object({
  magiclinkId: UuidSchema,
});

export type MagicLinkParams = z.infer<typeof MagicLinkParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const MagicLinkSchema = z
  .object({
    id: UuidSchema,
    email: EmailSchema,
    tokenHash: s.token,
    expiresAt: s.date,
    usedAt: s.nullableDate,
    ipAddress: IpAddressSchema.nullable(),
    userAgent: s.string.nullable(),
    createdAt: s.date,
    deletedAt: s.nullableDate,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateMagicLinkSchema = MagicLinkSchema.omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do MagicLinkSchema base
export const UpdateMagicLinkSchema = MagicLinkSchema.partial();

// ─── Response schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
export const MagicLinkResponseSchema = MagicLinkSchema.omit({
  deletedAt: true,
});

// Resumo para listagem: versão compacta — evita over-fetching
export const MagicLinkProjectionSchema = MagicLinkSchema.pick({
  id: true,
  email: true,
  createdAt: true,
});

// ─── Response wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa MagicLinkResponseSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

// Payload de criação: sem campos gerados pelo servidor

export const MagicLinkSessionProjectionSchema = z
  .object({
    magiclink: MagicLinkProjectionSchema,
    accessToken: s.token,
    refreshToken: s.token,
    expiresAt: s.date,
  })
  .strict();

export const MagicLinkCreateResponseSchema = createResponseSchema(
  MagicLinkResponseSchema,
);
export const MagicLinkFindByIdResponseSchema = findResponseSchema(
  MagicLinkResponseSchema,
);
export const MagicLinkUpdateResponseSchema = updateResponseSchema(
  MagicLinkResponseSchema,
);
export const MagicLinkActivateResponseSchema = actionResponseSchema();
export const MagicLinkDeactivateResponseSchema = actionResponseSchema();
export const MagicLinkProjectionResponseSchema = pageResponseSchema(
  MagicLinkProjectionSchema,
);
