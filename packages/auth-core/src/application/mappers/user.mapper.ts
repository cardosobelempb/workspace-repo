import { UserEntity } from "@/common/domain";
import { UserCreateDto, UserProjectionDto, UserUpdateDto } from "../dto/user.dto";

export class UserMapper {
  private static toCoreFields(entity: UserEntity): UserCreateDto {
    return {
      email: entity.email.getValue().value,
      firstName: entity.firstName,
      lastName: entity.lastName,
      passwordHash: entity.passwordHash.getValue(),
      emailVerified: entity.emailVerified?.toISOString() ?? null,
    };
  }

  static toCreatedResponse(entity: UserEntity): UserCreateDto {
    return this.toCoreFields(entity);
  }

  static toUpdatedResponse(entity: UserEntity): UserUpdateDto {
    return this.toCoreFields(entity);
  }

  static toProjection(entity: UserEntity): UserProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      firstName: entity.firstName,
      lastName: entity.lastName,
      emailVerified: entity.emailVerified?.toISOString() ?? null,
    };
  }

  static toHttp(entity: UserEntity): UserProjectionDto {
    return {
      id: entity.id.getValue(),
      email: entity.email.getValue().value,
      firstName: entity.firstName,
      lastName: entity.lastName,
      emailVerified: entity.emailVerified?.toISOString() ?? null,
    };
  }
}
