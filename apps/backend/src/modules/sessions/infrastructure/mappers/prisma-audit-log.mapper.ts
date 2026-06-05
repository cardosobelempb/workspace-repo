import { AuditLogDto } from "@/modules/identity/application/dto/audit-log.dto";
import { AuditLogEntity } from "@/modules/identity/domain/entities/audit-log.entity";
import { IpAddressVO, UUIDVO } from "@repo/common";
import { AuditLog as PrismaAuditLog } from "@repo/database";

export class PrismaAuditLogMapper {
  static toDomain(raw: PrismaAuditLog): AuditLogEntity {
    return AuditLogEntity.create(
      {
        action: raw.action,
        resource: raw.resource,
        userId: raw.userId ? UUIDVO.create(raw.userId) : null,
        tenantId: raw.tenantId ? UUIDVO.create(raw.tenantId) : null,
        organizationId: raw.organizationId ? UUIDVO.create(raw.organizationId) : null,
        resourceId: raw.resourceId ? UUIDVO.create(raw.resourceId) : null,
        ipAddress: raw.ipAddress ? IpAddressVO.create(raw.ipAddress) : null,
        userAgent: raw.userAgent,
        metadata: raw.metadata?.toString() ? JSON.parse(raw.metadata.toString()) : null,
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: AuditLogEntity): AuditLogDto {
    return {
      action: entity.action,
      resource: entity.resource,
      userId: entity.userId?.toString() || null,
      tenantId: entity.tenantId?.toString() || null,
      organizationId: entity.organizationId?.toString() || null,
      resourceId: entity.resourceId?.toString() || null,
      ipAddress: entity.ipAddress?.getValue() || null,
      userAgent: entity.userAgent || null,
      metadata:
        (entity.metadata as Record<string, string | number | boolean | null>) || {},
    };
  }

  static toPrisma(entity: AuditLogEntity): PrismaAuditLog {
    return {
      id: entity.id.getValue(),
      action: entity.action,
      resource: entity.resource,
      userId: entity.userId?.getValue() || null,
      tenantId: entity.tenantId?.getValue() || null,
      organizationId: entity.organizationId?.getValue() || null,
      resourceId: entity.resourceId?.getValue() || null,
      ipAddress: entity.ipAddress?.getValue() || null,
      userAgent: entity.userAgent || null,
      createdAt: entity.createdAt || new Date(),
      metadata: JSON.stringify(entity.metadata || {}),
    };
  }
}
