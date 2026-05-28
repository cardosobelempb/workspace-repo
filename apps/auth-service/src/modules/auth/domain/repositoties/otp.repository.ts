import { OtpEntity } from "@/modules/auth/domain/entities/otp.entity";
import { PrismaDatabase, PrismaRepository } from "@repo/database";

export abstract class OtpRepository extends PrismaRepository<OtpEntity> {
  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
}
