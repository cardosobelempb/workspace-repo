import { SessionEntity } from "@/common/domain";
import { SessionCreateDto, SessionProjectionDto, SessionUpdateDto } from "../dto";

export class SessionMapper {
  private static toCoreFields(entity: SessionEntity): SessionCreateDto {
    return {
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires.toISOString(),
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
    };
  }

  static toCreatedResponse(entity: SessionEntity): SessionCreateDto {
    return this.toCoreFields(entity);
  }

  static toUpdatedResponse(entity: SessionEntity): SessionUpdateDto {
    return this.toCoreFields(entity);
  }

  static toProjection(entity: SessionEntity): SessionProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires.toISOString(),
    };
  }

  static toHttp(entity: SessionEntity): SessionProjectionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires.toISOString(),
    };
  }
}
