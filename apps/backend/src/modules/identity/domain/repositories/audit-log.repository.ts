import { BaseRepository } from "@repo/common";
import { AuditLogEntity } from "../entities/audit-log.entity";

export abstract class AuditLogRepository extends BaseRepository<AuditLogEntity> {}
