// ─── Tipos inferidos ──────────────────────────────────────────────────────────
//
// Nunca escreva tipos manualmente — inferidos diretamente dos schemas.
// Se o schema mudar, o tipo muda junto automaticamente.

import {
  AuditLogActivateResponseSchema,
  AuditLogCreateResponseSchema,
  AuditLogDeactivateResponseSchema,
  AuditLogFindByIdResponseSchema,
  AuditLogProjectionSchema,
  AuditLogResponseSchema,
  AuditLogSchema,
  AuditLogUpdateResponseSchema,
  CreateAuditLogSchema,
  UpdateAuditLogSchema,
} from "@/modules/sessions/infrastructure/http/schemas/audit-log.schema";
import z from "zod";

export type AuditLogDto = z.infer<typeof AuditLogSchema>;
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
export type UpdateAuditLogDto = z.infer<typeof UpdateAuditLogSchema>;
export type AuditLogProjectionDto = z.infer<typeof AuditLogProjectionSchema>;
export type AuditLogResponseDto = z.infer<typeof AuditLogResponseSchema>;
export type AuditLogCreateResponseDto = z.infer<typeof AuditLogCreateResponseSchema>;
export type AuditLogFindByIdResponseDto = z.infer<typeof AuditLogFindByIdResponseSchema>;
export type AuditLogUpdateResponseDto = z.infer<typeof AuditLogUpdateResponseSchema>;
export type AuditLogActivateResponseDto = z.infer<typeof AuditLogActivateResponseSchema>;
export type AuditLogDeactivateResponseDto = z.infer<
  typeof AuditLogDeactivateResponseSchema
>;
