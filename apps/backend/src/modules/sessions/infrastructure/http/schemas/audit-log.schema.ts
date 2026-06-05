// ============================================================
// AuditLog.schema.ts
// Schemas exclusivos da entidade AuditLog.
// Importa dos shared — zero duplicação de erros/paginação.
// ============================================================

import {
  actionResponseSchema,
  createResponseSchema,
  findResponseSchema,
  MetadataUnknownSchema,
  pageResponseSchema,
  s,
  updateResponseSchema,
  UuidSchema,
} from "@repo/common";
import z from "zod";

// ─── Params ───────────────────────────────────────────────────────────────────

export const AuditLogParamsSchema = z.object({
  auditlogId: UuidSchema,
});

export type AuditLogParams = z.infer<typeof AuditLogParamsSchema>;

// ─── Schema base da entidade ──────────────────────────────────────────────────
//
// Fonte única de verdade para todos os schemas derivados.
//
// ⚠️  z.nativeEnum() — obrigatório para enums TypeScript.
//     z.enum() só aceita tuplas de string literal ["A","B"],
//     não enums compilados. Usar z.enum(EnumTS) quebra em runtime.

export const AuditLogSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema.nullable(),
    tenantId: UuidSchema.nullable(),
    organizationId: UuidSchema.nullable(),
    action: s.string,
    resource: s.string,
    resourceId: UuidSchema.nullable(),
    ipAddress: s.ipv4.nullable(),
    userAgent: s.string.nullable(),
    metadata: MetadataUnknownSchema.nullable(),
    createdAt: s.date,
  })
  .strict();

// ─── Body schemas (entrada) ───────────────────────────────────────────────────

// Payload de criação: sem campos gerados pelo servidor
export const CreateAuditLogSchema = AuditLogSchema.omit({});

// Payload de atualização: todos os campos opcionais
// Não precisa de .strict() extra — já herdado do AuditLogSchema base
export const UpdateAuditLogSchema = AuditLogSchema.partial();

// ─── Projection schemas (saída) ─────────────────────────────────────────────────

// Resposta completa: expõe tudo exceto campos de soft-delete
// export const AuditLogProjectionSchema = AuditLogSchema.omit({
//   ipAddress: true,
//   userAgent: true,
// });

// Resumo para listagem: versão compacta — evita over-fetching
export const AuditLogProjectionSchema = AuditLogSchema.pick({
  userId: true,
  tenantId: true,
  organizationId: true,
  action: true,
  resource: true,
  resourceId: true,
  metadata: true,
});

// ─── Projection wrappers via factory ───────────────────────────────────────────
//
// Cada wrapper envelopa AuditLogProjectionSchema (entidade completa),
// não o schema de input — a resposta de create/update devolve a entidade
// persistida, não o payload que o cliente enviou.

export const AuditLogCreateProjectionSchema = createResponseSchema(
  AuditLogProjectionSchema,
);
export const AuditLogFindByIdProjectionSchema = findResponseSchema(
  AuditLogProjectionSchema,
);
export const AuditLogUpdateProjectionSchema = updateResponseSchema(
  AuditLogProjectionSchema,
);
export const AuditLogActivateProjectionSchema = actionResponseSchema();
export const AuditLogDeactivateProjectionSchema = actionResponseSchema();
export const AuditLogProjectionProjectionSchema = pageResponseSchema(
  AuditLogProjectionSchema,
);
