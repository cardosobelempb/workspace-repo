import { AuditLogEntity } from "@/modules/identity/domain/entities/audit-log.entity";
import { AuditLogRepository } from "@/modules/identity/domain/repositories/audit-log.repository";
import { NotFoundError } from "@repo/common";
import {
  PRISMA_TOKENS,
  PrismaDatabase,
  PrismaRepository,
  PrismaTransaction,
} from "@repo/database";

export class PrismaAuditLogRepository
  extends PrismaRepository<AuditLogEntity>
  implements AuditLogRepository
{
  static inject = [PRISMA_TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  async findById(id: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }

  async exists(id: string): Promise<boolean> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!auditlog) return false;
    return true;
  }

  async findByEmail(email: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { email } });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { email } });
    if (!auditlog) return false;
    return true;
  }

  async create(entity: AuditLogEntity): Promise<AuditLogEntity> {
    const data = PrismaAuditLogMapper.toPrisma(entity);
    console.log("data", data);

    const auditlog = await this.prisma.auditLog.create({ data });

    return PrismaAuditLogMapper.toDomain(auditlog);
  }

  async save(entity: AuditLogEntity): Promise<AuditLogEntity> {
    const auditlog = await this.prisma.auditLog.update({
      where: { id: entity.id.toString() },
      data: {
        ...PrismaAuditLogMapper.toPrisma(entity),
      },
    });

    return PrismaAuditLogMapper.toDomain(auditlog);
  }

  async delete(entity: AuditLogEntity): Promise<void> {
    await this.prisma.auditLog.delete({
      where: { id: entity.id.toString() },
    });
  }

  async findManyByIds(ids: string[]): Promise<AuditLogEntity[]> {
    const auditlogs = await this.prisma.auditLog.findMany({
      where: { id: { in: ids } },
    });

    return auditlogs.map(PrismaAuditLogMapper.toDomain);
  }

  async findActiveById(id: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findFirst({
      where: { id, deletedAt: null },
    });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }
  async findActiveByEmail(email: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findFirst({
      where: { email, deletedAt: null },
    });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }
  async findActiveByIdWithProfile(id: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true },
    });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }
  async findWithRelations(id: string): Promise<AuditLogEntity | null> {
    const auditlog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!auditlog) return null;
    return PrismaAuditLogMapper.toDomain(auditlog);
  }
  async existsActiveById(id: string): Promise<boolean> {
    const auditlog = await this.prisma.auditLog.findFirst({
      where: { id, deletedAt: null },
    });
    if (!auditlog) return false;
    return true;
  }
  async existsActiveByEmail(email: string): Promise<boolean> {
    const auditlog = await this.prisma.auditLog.findFirst({
      where: { email, deletedAt: null },
    });
    if (!auditlog) return false;
    return true;
  }
  async countActiveByTenant(tenantId: string): Promise<number> {
    const count = await this.prisma.auditLog.count({
      where: { tenantId, deletedAt: null },
    });
    return count;
  }
  async changePassword(id: string, passwordHash: string): Promise<void> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!auditlog)
      throw new NotFoundError({
        fieldName: "AuditLog",
        value: id,
        message: `AuditLog with id ${id} not found`,
      });

    await this.prisma.auditLog.update({
      where: { id },
      data: { passwordHash },
    });
  }
  async restore(id: string): Promise<void> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!auditlog)
      throw new NotFoundError({
        fieldName: "AuditLog",
        value: id,
        message: `AuditLog with id ${id} not found`,
      });

    await this.prisma.auditLog.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
  async updatePasswordHash(auditlogId: string, passwordHash: string): Promise<void> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id: auditlogId } });
    if (!auditlog)
      throw new NotFoundError({
        fieldName: "AuditLog",
        value: auditlogId,
        message: `AuditLog with id ${auditlogId} not found`,
      });

    await this.prisma.auditLog.update({
      where: { id: auditlogId },
      data: { passwordHash },
    });
  }
  async markEmailAsVerified(auditlogId: string): Promise<void> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id: auditlogId } });
    if (!auditlog)
      throw new NotFoundError({
        fieldName: "AuditLog",
        value: auditlogId,
        message: `AuditLog with id ${auditlogId} not found`,
      });

    await this.prisma.auditLog.update({
      where: { id: auditlogId },
      data: { emailVerified: new Date() },
    });
  }
  async softDelete(auditlogId: string): Promise<void> {
    const auditlog = await this.prisma.auditLog.findUnique({ where: { id: auditlogId } });
    if (!auditlog)
      throw new NotFoundError({
        fieldName: "AuditLog",
        value: auditlogId,
        message: `AuditLog with id ${auditlogId} not found`,
      });

    await this.prisma.auditLog.update({
      where: { id: auditlogId },
      data: { deletedAt: new Date() },
    });
  }
  withTx(tx: PrismaTransaction): this {
    return new (this.constructor as new (tx: PrismaTransaction) => this)(tx);
  }
}
