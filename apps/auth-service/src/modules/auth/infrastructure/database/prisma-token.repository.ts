import { TOKENS, TokenType } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";
import { TokenEntity } from "../../domain/entities/token.entity";
import { TokenRepository } from "../../domain/repositoties/token.repository";
import { PrismaTokenMapper } from "../mappers/token.mapper";
import { TokenWhere } from "./types/token.types";

export class PrismaTokenRepository
  extends PrismaRepository<TokenEntity>
  implements TokenRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  async findValidByUserAndType(
    userId: string,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    const now = new Date();

    const token = await this.prisma.token.findFirst({
      where: {
        userId,
        type,
        revokedAt: null,
        expiredAt: {
          gt: now,
        },
      },
    });

    if (!token) {
      return null;
    }

    return PrismaTokenMapper.toDomain(token);
  }
  async findByValueHash(valueHash: string): Promise<TokenEntity | null> {
    const token = await this.prisma.token.findFirst({
      where: {
        valueHash,
      },
    });

    if (!token) {
      return null;
    }

    return PrismaTokenMapper.toDomain(token);
  }
  async revokeToken(valueHash: string): Promise<void> {
    const now = new Date();

    await this.prisma.token.updateMany({
      where: {
        valueHash,
        revokedAt: null,
        expiredAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });
  }
  async revokeAllByUser(userId: string): Promise<void> {
    const now = new Date();

    await this.prisma.token.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiredAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });
  }
  async expireToken(id: string): Promise<void> {
    const now = new Date();

    await this.prisma.token.updateMany({
      where: {
        id,
        expiredAt: {
          gt: now,
        },
      },
      data: {
        expiredAt: now,
      },
    });
  }
  async findValidByHash(params: {
    valueHash: string;
    type: TokenType;
  }): Promise<TokenEntity | null> {
    const now = new Date();

    const token = await this.prisma.token.findFirst({
      where: {
        valueHash: params.valueHash,
        type: params.type,
        revokedAt: null,
        expiredAt: {
          gt: now,
        },
      },
    });

    if (!token) {
      return null;
    }

    return PrismaTokenMapper.toDomain(token);
  }
  async revokeById(tokenId: string): Promise<void> {
    const now = new Date();

    await this.prisma.token.updateMany({
      where: {
        id: tokenId,
        revokedAt: null,
        expiredAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });
  }
  async revokeAllByUserId(userId: string, type?: TokenType): Promise<void> {
    const now = new Date();

    const whereClause: TokenWhere = {
      userId,
      revokedAt: null,
      expiredAt: {
        gt: now,
      },
    };

    if (type) {
      whereClause.type = type;
    }

    await this.prisma.token.updateMany({
      where: whereClause,
      data: {
        revokedAt: now,
      },
    });
  }
  async deleteExpired(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.token.deleteMany({
      where: {
        expiredAt: {
          lt: now,
        },
      },
    });

    return result.count;
  }
  async createRefreshToken(entity: TokenEntity): Promise<void> {
    const prismaToken = PrismaTokenMapper.toPrisma(entity);

    await this.prisma.token.create({
      data: prismaToken,
    });
  }
  async findValidRefreshToken(valueHash: string): Promise<TokenEntity | null> {
    const now = new Date();

    const token = await this.prisma.token.findFirst({
      where: {
        valueHash,
        type: TokenType.REFRESH,
        revokedAt: null,
        deletedAt: null,
        expiredAt: {
          gt: now,
        },
      },
    });

    if (!token) {
      return null;
    }

    return PrismaTokenMapper.toDomain(token);
  }
  async revokeRefreshToken(id: string): Promise<void> {
    const now = new Date();

    await this.prisma.token.updateMany({
      where: {
        id,
        type: TokenType.REFRESH,
        revokedAt: null,
        deletedAt: null,
        expiredAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });
  }
  async findById(id: string): Promise<TokenEntity | null> {
    const token = await this.prisma.token.findUnique({
      where: {
        id,
      },
    });

    if (!token) {
      return null;
    }

    return PrismaTokenMapper.toDomain(token);
  }
  async findManyByIds(ids: string[]): Promise<TokenEntity[]> {
    const tokens = await this.prisma.token.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return tokens.map(PrismaTokenMapper.toDomain);
  }
  async create(entity: TokenEntity): Promise<TokenEntity> {
    const prismaToken = PrismaTokenMapper.toPrisma(entity);

    const created = await this.prisma.token.create({
      data: prismaToken,
    });

    return PrismaTokenMapper.toDomain(created);
  }
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.token.count({
      where: {
        id,
      },
    });

    return count > 0;
  }
  async save(entity: TokenEntity): Promise<TokenEntity> {
    const prismaToken = PrismaTokenMapper.toPrisma(entity);

    const updated = await this.prisma.token.update({
      where: {
        id: prismaToken.id,
      },
      data: prismaToken,
    });

    return PrismaTokenMapper.toDomain(updated);
  }
  async delete(entity: TokenEntity): Promise<void> {
    await this.prisma.token.delete({
      where: {
        id: entity.id.getValue(),
      },
    });
  }
}
