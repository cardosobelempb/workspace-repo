import { NotFoundError, TOKENS } from "@repo/common";
import { PrismaDatabase, PrismaRepository, PrismaTransaction } from "@repo/database";
import { UserEntity } from "@/modules/user/domain/entities/user.entity";
import { UserRepository } from "@/modules/user/domain/repositoties/user.repository";
import { PrismaUserMapper } from "@/modules/user/infrastructure/mappers/prisma-user.mapper";

export class PrismaUserRepository
  extends PrismaRepository<UserEntity>
  implements UserRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return false;
    return true;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    return true;
  }

  async create(entity: UserEntity): Promise<UserEntity> {
    const data = PrismaUserMapper.toPrisma(entity);
    console.log("data", data);

    const user = await this.prisma.user.create({ data });

    return PrismaUserMapper.toDomain(user);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: entity.id.toString() },
      data: {
        ...PrismaUserMapper.toPrisma(entity),
      },
    });

    return PrismaUserMapper.toDomain(user);
  }

  async delete(entity: UserEntity): Promise<void> {
    await this.prisma.user.delete({
      where: { id: entity.id.toString() },
    });
  }

  async findManyByIds(ids: string[]): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });

    return users.map(PrismaUserMapper.toDomain);
  }

  async findActiveById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }
  async findActiveByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }
  async findActiveByIdWithProfile(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true },
    });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }
  async findWithRelations(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) return null;
    return PrismaUserMapper.toDomain(user);
  }
  async existsActiveById(id: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) return false;
    return true;
  }
  async existsActiveByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) return false;
    return true;
  }
  async countActiveByTenant(tenantId: string): Promise<number> {
    const count = await this.prisma.user.count({
      where: { tenantId, deletedAt: null },
    });
    return count;
  }
  async changePassword(id: string, passwordHash: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundError({
        fieldName: "User",
        value: id,
        message: `User with id ${id} not found`,
      });

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
  async restore(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundError({
        fieldName: "User",
        value: id,
        message: `User with id ${id} not found`,
      });

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundError({
        fieldName: "User",
        value: userId,
        message: `User with id ${userId} not found`,
      });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
  async markEmailAsVerified(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundError({
        fieldName: "User",
        value: userId,
        message: `User with id ${userId} not found`,
      });

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
  }
  async softDelete(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundError({
        fieldName: "User",
        value: userId,
        message: `User with id ${userId} not found`,
      });

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
  withTx(tx: PrismaTransaction): this {
    return new (this.constructor as new (tx: PrismaTransaction) => this)(tx);
  }
}
