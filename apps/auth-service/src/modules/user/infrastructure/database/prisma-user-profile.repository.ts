import { TOKENS } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";
import { UserProfileEntity } from "@/modules/user/domain/entities/user-profile.entity";
import { UserProfileRepository } from "@/modules/user/domain/repositoties/user-profile.repository";
import { PrismaUserProfileMapper } from "@/modules/user/infrastructure/mappers/prisma-user-profile.mapper";

export class PrismaUserProfileRepository
  extends PrismaRepository<UserProfileEntity>
  implements UserProfileRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }

  async findById(id: string): Promise<UserProfileEntity | null> {
    const profile = await this.prisma.userProfile.findUnique({ where: { id } });
    if (!profile) return null;
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async findManyByIds(ids: string[]): Promise<UserProfileEntity[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: { id: { in: ids } },
    });
    return profiles.map((profile) => PrismaUserProfileMapper.toDomain(profile));
  }
  async create(entity: UserProfileEntity): Promise<UserProfileEntity> {
    const profile = await this.prisma.userProfile.create({
      data: PrismaUserProfileMapper.toPrisma(entity),
    });
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.userProfile.count({ where: { id } });
    return count > 0;
  }
  async save(entity: UserProfileEntity): Promise<UserProfileEntity> {
    const profile = await this.prisma.userProfile.upsert({
      where: { id: entity.id.getValue() },
      create: PrismaUserProfileMapper.toPrisma(entity),
      update: PrismaUserProfileMapper.toPrisma(entity),
    });
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async delete(entity: UserProfileEntity): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: entity.id.getValue() },
    });
    if (!profile) return;
    await this.prisma.userProfile.delete({ where: { id: entity.id.getValue() } });
  }

  async findByUserId(userId: string): Promise<UserProfileEntity | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async findByDocumentNumber(document: string): Promise<UserProfileEntity | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { documentNumber: document },
    });
    if (!profile) return null;
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async existsByDocumentNumber(document: string): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { documentNumber: document },
    });
    return count > 0;
  }
  async upsert(userId: string, data: UserProfileEntity): Promise<UserProfileEntity> {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: PrismaUserProfileMapper.toPrisma(data),
      update: PrismaUserProfileMapper.toPrisma(data),
    });
    return PrismaUserProfileMapper.toDomain(profile);
  }
  async updateAvatar(userId: string, avatarUrl: string): Promise<UserProfileEntity> {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });
    return PrismaUserProfileMapper.toDomain(profile);
  }
}
