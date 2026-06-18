import { User as PrismaUser } from "@prisma/client";
import { EmailVO, PasswordHashVO, UserDto, UserEntity, UUIDVO } from "@repo/common";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): UserEntity {
    return UserEntity.create(
      {
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: EmailVO.create(raw.email),
        passwordHash: PasswordHashVO.create(raw.passwordHash || ""),
        emailVerified: raw.emailVerified,
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: UserEntity): UserDto {
    return {
      id: entity.id.toString(),
      firstName: entity.firstName,
      lastName: entity.lastName,
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
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email.getValue().value,
      passwordHash: entity.passwordHash?.getValue(),
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
