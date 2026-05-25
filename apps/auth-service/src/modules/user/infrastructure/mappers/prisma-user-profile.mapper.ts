import { BirthDateVO, PhoneVO, UrlVO, UUIDVO } from "@repo/common";
import { UserProfile as PrismaUserProfile } from "@repo/database";
import { UserProfileDto } from "@/modules/user/application/dto/user-profile.dto";
import { UserProfileEntity } from "@/modules/user/domain/entities/user-profile.entity";

export class PrismaUserProfileMapper {
  static toDomain(raw: PrismaUserProfile): UserProfileEntity {
    return UserProfileEntity.create(
      {
        userId: UUIDVO.create(raw.userId),
        fullName: raw.fullName || `${raw.firstName} ${raw.lastName}`,
        firstName: raw.firstName || "",
        lastName: raw.lastName || "",
        displayName: raw.displayName || raw.firstName || "",
        birthDate: raw.birthDate
          ? BirthDateVO.create(raw.birthDate)
          : BirthDateVO.create(new Date(0)),
        phone: PhoneVO.create(raw.phone) || "",
        avatarUrl: raw.avatarUrl ? UrlVO.create(raw.avatarUrl) : UrlVO.create(""),
        documentNumber: raw.documentNumber || "",
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      UUIDVO.create(raw.id),
    );
  }

  static toDTO(entity: UserProfileEntity): UserProfileDto {
    return {
      id: entity.id.toString(),
      userId: entity.userId.toString(),
      fullName: entity.fullName,
      status: entity.status,
      firstName: entity.firstName,
      lastName: entity.lastName,
      displayName: entity.displayName,
      birthDate: entity.birthDate.getValue(),
      phone: entity.phone.getValue(),
      avatarUrl: entity.avatarUrl.getValue(),
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toPrisma(entity: UserProfileEntity): PrismaUserProfile {
    return {
      id: entity.id.getValue(),
      userId: entity.userId.getValue(),
      fullName: entity.fullName,
      status: entity.status,
      firstName: entity.firstName,
      lastName: entity.lastName,
      displayName: entity.displayName,
      birthDate: entity.birthDate.getValue(),
      phone: entity.phone.getValue(),
      avatarUrl: entity.avatarUrl.getValue(),
      documentType: entity.documentType,
      documentNumber: entity.documentNumber,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
