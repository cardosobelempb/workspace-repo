import { PrismaUserProfileRepository } from "@/modules/user/infrastructure/database/prisma-user-profile.repository";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  BadRequestError,
  ConflictError,
  Either,
  HASH_DI_TOKENS,
  left,
  right,
} from "@repo/common";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";
import { REPOSITORY_CONSTANTS } from "../../infrastructure/database/constant";
import { RegisterBodyDto, RegisterProjectionDto } from "../dto/register.dto";

import { UserFactory } from "../factories/user.factory";

export type RegisterUseCaseResponse = Either<BadRequestError, RegisterProjectionDto>;

export class RegisterUseCase {
  static inject = [
    HASH_DI_TOKENS.HASH_GENERATOR,
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
      password: passwordHash,
    });
    const createdUser = await this.prismaUserRepository.create(userEntity);

    return right({
      email: createdUser.email.toString(),
    });
  }
}
