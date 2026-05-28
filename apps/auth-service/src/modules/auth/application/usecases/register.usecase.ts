import { BcryptHasherService } from "@/modules/auth/domain/services/bcrypt-hasher.service";
import {
  UserProjectionDto,
  UserRegisterDto,
} from "@/modules/user/application/dto/user.dto";
import { UserMapper } from "@/modules/user/application/mappers/user.mapper";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import { BadRequestError, ConflictError, Either, left, right } from "@repo/common";
import { UserFactory } from "../factories/user.factory";

export type RegisterUseCaseResponse = Either<BadRequestError, UserProjectionDto>;

export class RegisterUseCase {
  static inject = [BcryptHasherService, PrismaUserRepository];

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

    const createdUser = await this.prismaUserRepository.create(userEntity);

    return right(UserMapper.toProjection(createdUser));
  }
}
