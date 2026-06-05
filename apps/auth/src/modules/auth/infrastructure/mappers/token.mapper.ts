import { Token as PrismaToken } from "@repo/database";

import { IpAddressVO, TokenType, UUIDVO } from "@repo/common";

import { TokenDto } from "../../application/dto/token.dto";
import { TokenEntity } from "../../domain/entities/token.entity";

export class PrismaTokenMapper {
  static toDomain(raw: PrismaToken): TokenEntity {
    return TokenEntity.create(
      {
        userId: UUIDVO.create(raw.userId),
        type: raw.type as TokenType,
        valueHash: raw.valueHash,
        userAgent: raw.userAgent || "",
        expiredAt: raw.expiredAt,
        ipAddress: raw.ipAddress
          ? IpAddressVO.create(raw.ipAddress)
          : IpAddressVO.create(""),
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: TokenEntity): TokenDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      type: entity.type,
      valueHash: entity.valueHash,
      expiredAt: entity.expiredAt,
      ipAddress: entity.ipAddress.getValue(),
      userAgent: entity.userAgent,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toPrisma(entity: TokenEntity): PrismaToken {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      type: entity.type,
      valueHash: entity.valueHash,
      expiredAt: entity.expiredAt,
      ipAddress: entity.ipAddress.getValue(),
      userAgent: entity.userAgent,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
