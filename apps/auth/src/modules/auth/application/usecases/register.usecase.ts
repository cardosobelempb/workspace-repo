import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  BadRequestError,
  ConflictError,
  DI_HASH,
  Either,
  left,
  right,
} from "@repo/common";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";
import { RegisterBodyDto, RegisterProjectionDto } from "../dto/register.dto";

import { DI_PRISMA_REPOSITORY } from "@repo/database";
import { UserFactory } from "../factories/user.factory";

export type RegisterUseCaseResponse = Either<BadRequestError, RegisterProjectionDto>;

export class RegisterUseCase {
  static inject = [DI_HASH.HASH_GENERATOR, DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly prismaUserRepository: PrismaUserRepository,
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
