import { Session as PrismaSession } from "@repo/database";

import { UUIDVO } from "@repo/common";
import { SessionDto } from "../../application/dto/session.dto";
import { SessionEntity } from "../../domain/entities/session.entity";

export class PrismaSessionMapper {
  static toDomain(raw: PrismaSession): SessionEntity {
    return SessionEntity.create(
      {
        userId: UUIDVO.create(raw.userId),
        expires: raw.expires,
        sessionToken: raw.sessionToken,
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: SessionEntity): SessionDto {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toPrisma(entity: SessionEntity): PrismaSession {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      sessionToken: entity.sessionToken,
      expires: entity.expires,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
