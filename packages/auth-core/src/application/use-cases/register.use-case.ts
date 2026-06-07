import { BcryptHasher, ConflictError, Either, left, right } from "@repo/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { AuthUserProjectionDto, RegisterDto } from "../dto/auth.dto";

import { AUTH_DI_TOKENS, AUTH_TOKEN_CONSTANTS } from "../../constants";
import { UserFactory } from "../factories";

export type RegisterUseCaseResponse = Either<ConflictError, AuthUserProjectionDto>;

export class RegisterUseCase {
  static inject = [AUTH_DI_TOKENS.USER_REPOSITORY, AUTH_DI_TOKENS.PASSWORD_HASHER];

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: BcryptHasher,
  ) {}

  async execute(input: RegisterDto): Promise<RegisterUseCaseResponse> {
    const email = input.email.toLowerCase().trim();
    const alreadyExists = await this.userRepository.existsByEmail(email);

    if (alreadyExists) {
      return left(
        new ConflictError({ fieldName: "email", message: "E-mail já cadastrado." }),
      );
    }

    const passwordHash = await this.passwordHasher.hash(
      input.passwordHash,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );

    const userFactory = UserFactory.build({
      email: input.email,
      passwordHash: passwordHash,
      emailVerified: null,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const user = await this.userRepository.create(userFactory);

    return right({
      id: user.id.getValue(),
      email: user.email.getValue().value,
      emailVerified: user.emailVerified,
    });
  }
}
