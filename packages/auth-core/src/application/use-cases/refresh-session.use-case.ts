import {
  Either,
  HashGenerator,
  left,
  right,
  TokenGenerator,
  UnauthorizedError,
} from "@repo/common";
import { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import { SessionRepository } from "../../domain/repositories/session.repository";
import { UserRepository } from "../../domain/repositories/user.repository";
import { AuthProjectionDto } from "../dto/auth.dto";
import { SessionFactory } from "../factories/session.factory";

import { AUTH_DI_TOKENS, AUTH_TOKEN_CONSTANTS } from "../../constants";

export type RefreshSessionUseCaseResponse = Either<UnauthorizedError, AuthProjectionDto>;
export type RefreshSessionMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

export class RefreshSessionUseCase {
  static inject = [
    AUTH_DI_TOKENS.SESSION_TOKEN_SERVICE,
    AUTH_DI_TOKENS.SESSION_TOKEN_SERVICE,
    AUTH_DI_TOKENS.USER_REPOSITORY,
    AUTH_DI_TOKENS.SESSION_REPOSITORY,
    AUTH_DI_TOKENS.SESSION_CACHE_REPOSITORY,
  ];

  constructor(
    private readonly tokenGenerator: TokenGenerator<{ userId: string }>,
    private readonly hashGenerator: HashGenerator,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly cache: SessionCacheRepository,
  ) {}

  async execute(
    rawSessionToken: string,
    metadata: RefreshSessionMetadata,
  ): Promise<RefreshSessionUseCaseResponse> {
    const oldHash = await this.hashGenerator.hash(
      rawSessionToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const current = await this.sessions.findValidByTokenHash(oldHash);

    if (!current) {
      return left(
        new UnauthorizedError({
          fieldName: "session",
          message: "Sessão inválida ou expirada.",
        }),
      );
    }

    const user = await this.users.findActiveById(current.userId.getValue());
    if (!user) {
      return left(
        new UnauthorizedError({
          fieldName: "user",
          message: "Usuário inválido ou inativo.",
        }),
      );
    }

    await this.sessions.revokeByTokenHash(oldHash);
    await this.cache.delete(oldHash);

    const newToken = await this.tokenGenerator.generate({ userId: user.id.getValue() });
    const newHash = await this.hashGenerator.hash(
      newToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(
      Date.now() + AUTH_TOKEN_CONSTANTS.SESSION_TTL_SECONDS * 1000,
    );

    const session = await this.sessions.create(
      SessionFactory.build({
        userId: user.id.getValue(),
        sessionToken: newHash,
        expires: expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }),
    );

    await this.cache.set(session);

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
      },
      accessToken: newToken,
      refreshToken: newToken,
      expiresAt,
    });
  }
}
