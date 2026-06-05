import { UserRegisterDto } from "@/modules/user/application/dto/user.dto";
import { UserProfileProfileMapper } from "@/modules/user/application/mappers/user-profile.mapper";
import { UserMapper } from "@/modules/user/application/mappers/user.mapper";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  BadRequestError,
  ConflictError,
  CRYPTOGRAPHY_TOKENS,
  Either,
  left,
  right,
} from "@repo/common";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";
import { REPOSITORY_CONSTANTS } from "../../infrastructure/database/constant";
import { RegisterProjectionDto } from "../dto/register.dto";
import { UserFactory } from "../factories/register.factory";

export type RegisterUseCaseResponse = Either<BadRequestError, RegisterProjectionDto>;

export class RegisterUseCase {
  static inject = [
    CRYPTOGRAPHY_TOKENS.BCRYPT_HASHER,
    REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly prismaUserRepository: PrismaUserRepository,
  ) {}

  async execute(input: UserRegisterDto): Promise<RegisterUseCaseResponse> {
    const existingUser = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (existingUser) {
      return left(
        new ConflictError({
          fieldName: "email",
          message: "E-mail já cadastrado",
        }),
      );
    }

    const passwordHash = await this.bcryptHasherService.hash(input.passwordHash);

    const userEntity = UserFactory.buildUserRegister({
      email: input.email,
      passwordHash: passwordHash,
    });

    const profileEntity = UserProfileFactory.buildUserProfileRegister({
      userId: userEntity.id,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const createdUser = await this.prismaUserRepository.create(userEntity);

    return right({
      user: UserMapper.toProjection(createdUser),
      profile: UserProfileProfileMapper.toProjection(createdUser.profile),
    });
  }
}
