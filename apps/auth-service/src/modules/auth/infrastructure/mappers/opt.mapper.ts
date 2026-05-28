import { Otp as PrismaOtp } from "@repo/database";

import { PhoneVO, UUIDVO } from "@repo/common";
import { OtpDto } from "../../application/dto/otp.dto";
import { OtpEntity } from "../../domain/entities/otp.entity";

export class PrismaOtpMapper {
  static toDomain(raw: PrismaOtp): OtpEntity {
    return OtpEntity.create(
      {
        userId: raw.userId
          ? UUIDVO.create(raw.userId)
          : UUIDVO.create("00000000-0000-0000-0000-000000000000"),
        phone: PhoneVO.create(raw.phone),
        codeHash: raw.codeHash,
        expiredAt: raw.expiredAt,
        attempts: raw.attempts,
        usedAt: raw.usedAt,
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: OtpEntity): OtpDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      phone: entity.phone.getValue(),
      codeHash: entity.codeHash,
      expiredAt: entity.expiredAt,
      attempts: entity.attempts,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toPrisma(entity: OtpEntity): PrismaOtp {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue() || null,
      phone: entity.phone.getValue(),
      codeHash: entity.codeHash,
      expiredAt: entity.expiredAt,
      attempts: entity.attempts,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt || new Date(),
      deletedAt: entity.deletedAt || null,
    };
  }
}
