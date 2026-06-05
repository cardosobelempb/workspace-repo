import { EmailVO, PasswordVO, UUIDVO } from "@repo/common";
import { User as PrismaUser } from "@repo/database";

import { UserEntity } from "@/modules/user/domain/entities/user.entity";
import { UserDto } from "../../application/dto/user.dto";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): UserEntity {
    return UserEntity.create(
      {
        email: EmailVO.create(raw.email || ""),
        passwordHash: PasswordVO.create(raw.passwordHash),
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: UserEntity): UserDto {
    return {
      id: entity.id.toString(),
      email: entity.email.getValue().value,
      passwordHash: entity.passwordHash?.getValue(),
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toPrisma(entity: UserEntity): PrismaUser {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      passwordHash: entity.passwordHash?.getValue(),
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
