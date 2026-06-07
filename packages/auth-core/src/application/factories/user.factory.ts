import { EmailVO, PasswordHashVO } from "@repo/common";
import { UserEntity } from "../../domain/entities";
import { UserCreateDto } from "../dto/user.dto";

export type BuildUserInput = {
  userId: string;
  sessionToken: string;
  expires: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class UserFactory {
  static build(input: UserCreateDto): UserEntity {
    return UserEntity.create({
      email: EmailVO.create(input.email),
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: PasswordHashVO.create(input.passwordHash),
      emailVerified: input.emailVerified ? new Date(input.emailVerified) : null,
    });
  }
}
