// packages/auth-core/src/application/use-cases/oauth-login.use-case.ts

import { AUTH_TOKEN_CONSTANTS } from "@/common/constants";
import { UserEntity } from "@/common/domain";
import { Either, HashGenerator, left, right, TokenGenerator } from "@repo/common";
import type { OAuthProvider } from "../../domain/providers/oauth-provider";
import type { AccountRepository } from "../../domain/repositories/account.repository";
import type { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import type { SessionRepository } from "../../domain/repositories/session.repository";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { UserProjectionDto } from "../dto/user.dto";
import { AccountFactory, SessionFactory } from "../factories";
import { UserMapper } from "../mappers/user.mapper";

export type OAuthLoginInput = {
  code: string;
  redirectUri: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type OAuthLoginOutput = {
  sessionToken: string;
  expiresAt: Date;
  user: UserProjectionDto;
  isNewUser: boolean;
};

export type OAuthLoginError =
  | { code: "OAUTH_PROFILE_ERROR"; message: string }
  | { code: "ACCOUNT_DELETED" };

export class OAuthLoginUseCase {
  constructor(
    private readonly oauthProvider: OAuthProvider,
    private readonly userRepository: UserRepository,
    private readonly accountRepository: AccountRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionCacheRepository: SessionCacheRepository,
    private readonly tokenGenerator: TokenGenerator<{ sessionToken: string }>,
    private readonly hashGenerator: HashGenerator,
    private readonly sessionTtlSeconds: number = 604800,
  ) {}

  async execute(
    input: OAuthLoginInput,
  ): Promise<Either<OAuthLoginError, OAuthLoginOutput>> {
    let profile;
    try {
      profile = await this.oauthProvider.getUserProfile({
        code: input.code,
        redirectUri: input.redirectUri,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return left({ code: "OAUTH_PROFILE_ERROR", message });
    }

    let isNewUser = false;

    let account = await this.accountRepository.findByProvider(
      profile.provider,
      profile.providerAccountId,
    );

    let user: UserEntity;

    if (account) {
      const found = await this.userRepository.findById(account.id.getValue());
      if (!found || found.deletedAt) {
        return left({ code: "ACCOUNT_DELETED" });
      }
      user = found;
    } else {
      let existing = await this.userRepository.findByEmail(profile.email);

      if (!existing) {
        isNewUser = true;
        existing = await this.userRepository.create({
          email: profile.email,
          firstName: profile.name ?? null,
          emailVerified: profile.emailVerified ? new Date() : null,
        } as any);
      }

      user = existing;

      const accountFactory = AccountFactory.build({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        userId: user.id.getValue(),
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        expiresAt: profile.expiresAt ? Number(profile.expiresAt) : null,
      });

      await this.accountRepository.create(accountFactory);
    }

    const rawToken = await this.tokenGenerator.generate({ sessionToken: "" });
    const tokenHash = await this.hashGenerator.hash(
      rawToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);

    const sessionFactory = SessionFactory.build({
      userId: user.id.getValue(),
      sessionToken: tokenHash,
      expires: expiresAt.toISOString(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    const session = await this.sessionRepository.create(sessionFactory);

    await this.sessionCacheRepository.set(session);

    return right({
      sessionToken: rawToken,
      expiresAt,
      user: UserMapper.toProjection(user),
      isNewUser,
    });
  }
}
