import { TOKENS } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";
import { SessionEntity } from "../../domain/entities/session.entity";
import { SessionRepository } from "../../domain/repositoties/session.repository";
import { PrismaSessionMapper } from "../mappers/session.mapper";

export class PrismaSessionRepository
  extends PrismaRepository<SessionEntity>
  implements SessionRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  async findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null> {
    const raw = await this.prisma.session.findFirst({
      where: {
        sessionToken: sessionTokenHash,
        expires: {
          gt: new Date(),
        },
        deletedAt: null,
      },
    });
    return raw ? PrismaSessionMapper.toDomain(raw) : null;
  }
  async revokeAllByUserId(userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.session.updateMany({
      where: {
        userId,
        expires: {
          gt: now,
        },
        deletedAt: null,
      },
      data: {
        expires: now,
        updatedAt: now,
      },
    });
  }
  async revokeByTokenHash(sessionTokenHash: string): Promise<void> {
    const now = new Date();
    await this.prisma.session.updateMany({
      where: {
        sessionToken: sessionTokenHash,
        expires: {
          gt: now,
        },
        deletedAt: null,
      },
      data: {
        expires: now,
        updatedAt: now,
      },
    });
  }
  async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    const raws = await this.prisma.session.findMany({
      where: {
        userId,
        expires: {
          gt: new Date(),
        },
        deletedAt: null,
      },
    });
    return raws.map(PrismaSessionMapper.toDomain);
  }
  async findBySessionToken(sessionToken: string): Promise<SessionEntity | null> {
    const raw = await this.prisma.session.findFirst({
      where: {
        sessionToken,
        deletedAt: null,
      },
    });
    return raw ? PrismaSessionMapper.toDomain(raw) : null;
  }
  async revoke(sessionId: string): Promise<void> {
    const now = new Date();
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        expires: {
          gt: now,
        },
        deletedAt: null,
      },
      data: {
        expires: now,
        updatedAt: now,
      },
    });
  }
  async findById(id: string): Promise<SessionEntity | null> {
    const raw = await this.prisma.session.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    return raw ? PrismaSessionMapper.toDomain(raw) : null;
  }
  async findManyByIds(ids: string[]): Promise<SessionEntity[]> {
    const raws = await this.prisma.session.findMany({
      where: {
        id: {
          in: ids,
        },
        deletedAt: null,
      },
    });
    return raws.map(PrismaSessionMapper.toDomain);
  }
  async create(entity: SessionEntity): Promise<SessionEntity> {
    const raw = await this.prisma.session.create({
      data: PrismaSessionMapper.toPrisma(entity),
    });
    return PrismaSessionMapper.toDomain(raw);
  }
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.session.count({
      where: {
        id,
        deletedAt: null,
      },
    });
    return count > 0;
  }
  async save(entity: SessionEntity): Promise<SessionEntity> {
    const raw = await this.prisma.session.update({
      where: {
        id: entity.id.getValue(),
      },
      data: PrismaSessionMapper.toPrisma(entity),
    });
    return PrismaSessionMapper.toDomain(raw);
  }
  async delete(entity: SessionEntity): Promise<void> {
    await this.prisma.session.update({
      where: {
        id: entity.id.getValue(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
