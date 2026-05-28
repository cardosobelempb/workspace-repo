import { TOKENS } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";
import { OtpEntity } from "../../domain/entities/otp.entity";
import { OtpRepository } from "../../domain/repositoties/otp.repository";
import { PrismaOtpMapper } from "../mappers/opt.mapper";

export class PrismaSessionRepository
  extends PrismaRepository<OtpEntity>
  implements OtpRepository
{
  static inject = [TOKENS.PRISMA_CLIENT];

  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  async findById(id: string): Promise<OtpEntity | null> {
    const otp = await this.prisma.otp.findUnique({
      where: {
        id,
      },
    });

    if (!otp) {
      return null;
    }

    return PrismaOtpMapper.toDomain(otp);
  }
  async findManyByIds(ids: string[]): Promise<OtpEntity[]> {
    const otps = await this.prisma.otp.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return otps.map(PrismaOtpMapper.toDomain);
  }
  async create(entity: OtpEntity): Promise<OtpEntity> {
    const otp = await this.prisma.otp.create({
      data: PrismaOtpMapper.toPrisma(entity),
    });

    return PrismaOtpMapper.toDomain(otp);
  }
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.otp.count({
      where: {
        id,
      },
    });

    return count > 0;
  }
  async save(entity: OtpEntity): Promise<OtpEntity> {
    const otp = await this.prisma.otp.update({
      where: {
        id: entity.id.getValue(),
      },
      data: PrismaOtpMapper.toPrisma(entity),
    });

    return PrismaOtpMapper.toDomain(otp);
  }
  async delete(entity: OtpEntity): Promise<void> {
    await this.prisma.otp.delete({
      where: {
        id: entity.id.getValue(),
      },
    });
  }
}
