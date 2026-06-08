import {
  Either,
  HASH_DI_TOKENS,
  HashComparer,
  HashGenerator,
  left,
  right,
  TOKEN_DI_TOKENS,
  TokenGenerator,
  UnauthorizedError,
} from "@repo/common";
import { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import { SessionRepository } from "../../domain/repositories/session.repository";
import { UserRepository } from "../../domain/repositories/user.repository";
import { AuthProjectionDto, LoginDto } from "../dto/auth.dto";
import { SessionFactory } from "../factories/session.factory";

import { AUTH_DI_TOKENS, AUTH_TOKEN_CONSTANTS } from "../../constants";

export type CreateSessionUseCaseResponse = Either<UnauthorizedError, AuthProjectionDto>;
export type RequestSessionMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

export class CreateSessionUseCase {
  static inject = [
    HASH_DI_TOKENS.HASH_GENERATOR,
    HASH_DI_TOKENS.HASH_COMPARER,
    TOKEN_DI_TOKENS.TOKEN_GENERATOR,
    AUTH_DI_TOKENS.USER_REPOSITORY,
    AUTH_DI_TOKENS.SESSION_REPOSITORY,
    AUTH_DI_TOKENS.SESSION_CACHE_REPOSITORY,
  ];

  constructor(
    private readonly tokenGenerator: TokenGenerator<{ userId: string }>,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheRepository: SessionCacheRepository,
  ) {}

  async execute(
    input: LoginDto,
    metadata: RequestSessionMetadata,
  ): Promise<CreateSessionUseCaseResponse> {
    const user = await this.userRepository.findActiveByEmail(
      input.email.toLowerCase().trim(),
    );
    if (!user)
      return left(
        new UnauthorizedError({ fieldName: "email", message: "Credenciais inválidas." }),
      );

    const passwordMatches = await this.hashComparer.compare(
      input.password,
      user.passwordHash.getValue(),
    );
    if (!passwordMatches)
      return left(
        new UnauthorizedError({
          fieldName: "password",
          message: "Credenciais inválidas.",
        }),
      );

    const sessionToken = await this.tokenGenerator.generate({
      userId: user.id.getValue(),
    });
    const sessionTokenHash = await this.hashGenerator.hash(
      sessionToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(
      Date.now() + AUTH_TOKEN_CONSTANTS.SESSION_TTL_SECONDS * 1000,
    );

    const sessionEntity = SessionFactory.build({
      userId: user.id.getValue(),
      sessionToken: sessionTokenHash,
      expires: expiresAt.toISOString(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    const session = await this.sessionRepository.create(sessionEntity);
    await this.sessionCacheRepository.set(session);

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
      },
      accessToken: sessionToken,
      refreshToken: sessionToken,
      expiresAt: session.expires,
    });
  }
}
