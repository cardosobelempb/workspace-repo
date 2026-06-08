import { MagicLinkTokenEntity, UserEntity } from "../../domain/entities";
import {
  MagicLinkTokenCreateDto,
  MagicLinkTokenProjectionDto,
  MagicLinkTokenUpdateDto,
  MagicLinkTokenUserProjectionDto,
} from "../dto";
import { UserMapper } from "./user.mapper";

export class MagicLinkMapper {
  private static toCoreFields(entity: MagicLinkTokenEntity): MagicLinkTokenCreateDto {
    return {
      email: entity.email.getValue().value,
      tokenHash: entity.tokenHash,
      ipAddress: entity.ipAddress.getValue(),
      userAgent: entity.userAgent.getValue(),
      expiresAt: entity.expiresAt.toISOString(),
      usedAt: entity.usedAt ? entity.usedAt.toISOString() : null,
    };
  }

  static toCreatedResponse(entity: MagicLinkTokenEntity): MagicLinkTokenCreateDto {
    return this.toCoreFields(entity);
  }

  static toUpdatedResponse(entity: MagicLinkTokenEntity): MagicLinkTokenUpdateDto {
    return this.toCoreFields(entity);
  }

  static toProjection(entity: MagicLinkTokenEntity): MagicLinkTokenProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt.toISOString(),
      usedAt: entity.usedAt ? entity.usedAt.toISOString() : null,
    };
  }

  static toMagicLinkTokenUserProjection(
    entity: MagicLinkTokenEntity,
    user: UserEntity,
  ): MagicLinkTokenUserProjectionDto {
    return {
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt.toISOString(),
      user: UserMapper.toProjection(user), // Assuming the MagicLinkTokenEntity has a 'user' relation
    };
  }

  static toHttp(entity: MagicLinkTokenEntity): MagicLinkTokenProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt.toISOString(),
      usedAt: entity.usedAt ? entity.usedAt.toISOString() : null,
    };
  }
}
