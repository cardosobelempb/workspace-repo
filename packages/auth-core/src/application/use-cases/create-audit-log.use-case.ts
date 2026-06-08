// packages/auth-core/src/application/use-cases/create-audit-log.use-case.ts

import type { AuditLogEntity } from "../../domain/entities/audit-log.entity";
import type { AuditLogRepository } from "../../domain/repositories/audit-log.repository";

export class CreateAuditLogUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(input: AuditLogEntity): Promise<AuditLogEntity> {
    return this.auditLogRepository.create(input);
  }
}
