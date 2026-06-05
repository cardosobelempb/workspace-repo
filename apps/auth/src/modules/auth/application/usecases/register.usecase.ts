import { UserProfileProfileMapper } from "@/modules/user/application/mappers/user-profile.mapper";
import { UserMapper } from "@/modules/user/application/mappers/user.mapper";
import { PrismaUserProfileRepository } from "@/modules/user/infrastructure/database/prisma-user-profile.repository";
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
import { RegisterBodyDto, RegisterProjectionDto } from "../dto/register.dto";
import { UserProfileFactory } from "../factories/user-profile.factory";
import { UserFactory } from "../factories/user.factory";

export type RegisterUseCaseResponse = Either<BadRequestError, RegisterProjectionDto>;

export class RegisterUseCase {
  static inject = [
    CRYPTOGRAPHY_TOKENS.BCRYPT_HASHER,
    REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
    REPOSITORY_CONSTANTS.PRISMA_USER_PROFILE_REPOSITORY,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly prismaUserRepository: PrismaUserRepository,
    private readonly prismaUserProfileRepository: PrismaUserProfileRepository,
  ) {}

  async execute(input: RegisterBodyDto): Promise<RegisterUseCaseResponse> {
    const existingUser = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (existingUser) {
      return left(
        new ConflictError({
          fieldName: "email",
          message: "Já existe um usuário registrado com este e-mail.",
        }),
      );
    }

    const passwordHash = await this.bcryptHasherService.hash(input.password);

    const userEntity = UserFactory.build({
      email: input.email,
      passwordHash: passwordHash,
      emailVerified: null,
    });
    const createdUser = await this.prismaUserRepository.create(userEntity);

    const profileEntity = UserProfileFactory.build({
      ...input.profile,
      userId: createdUser.id.getValue(),
    });
    const createdProfile = await this.prismaUserProfileRepository.create(profileEntity);

    return right({
      user: UserMapper.toProjection(createdUser),
      profile: UserProfileProfileMapper.toProjection(createdProfile),
    });
  }
}
