import { BaseRepository } from "@repo/common";
import { OtpEntity } from "@/modules/auth/domain/entities/otp.entity";

export abstract class OtpRepository extends BaseRepository<OtpEntity> {}
