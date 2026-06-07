import { BaseRepository } from "@repo/common";
import { AuditLogEntity } from "../entities";

export abstract class AuditLogRepository extends BaseRepository<AuditLogEntity> {}
