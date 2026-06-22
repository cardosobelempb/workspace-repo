import {
  BadRequestError,
  ConflictError,
  DI_HASH,
  Either,
  left,
  right,
  UserFactory,
  UserRegisterDto,
  UserRegisterProjectionDto,
} from "@repo/common";
import { HasherService } from "../../domain/services/hasher.service";

import { DI_PRISMA_REPOSITORY, PrismaUserRepository } from "@repo/database";

export type RegisterUseCaseResponse = Either<BadRequestError, UserRegisterProjectionDto>;

export class RegisterUseCase {
  static inject = [DI_HASH.HASH_GENERATOR, DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY];

  constructor(
    private readonly hasherService: HasherService,
    private readonly prismaUserRepository: PrismaUserRepository,
  ) {}

  async execute(input: UserRegisterDto): Promise<RegisterUseCaseResponse> {
    const existingUser = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (existingUser) {
      return left(
        new ConflictError({
          fieldName: "email",
          message: "Já existe um usuário registrado com este e-mail.",
        }),
      );
    }

    const passwordHash = await this.hasherService.hash(input.passwordHash);

    const userEntity = UserFactory.buildUserRegister({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: passwordHash,
    });
    const createdUser = await this.prismaUserRepository.create(userEntity);

    return right({
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      email: createdUser.email.toString(),
      id: createdUser.id.toString(),
      createdAt: createdUser.createdAt,
    });
  }
}
