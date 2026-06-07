import { BcryptHasher } from "@repo/common";
import { AUTH_DI_TOKENS } from "../../constants";
import { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import { SessionRepository } from "../../domain/repositories/session.repository";

export class LogoutUseCase {
  static inject = [
    AUTH_DI_TOKENS.SESSION_TOKEN_SERVICE,
    AUTH_DI_TOKENS.SESSION_REPOSITORY,
    AUTH_DI_TOKENS.SESSION_CACHE_REPOSITORY,
  ];

  constructor(
    private readonly tokenHasher: BcryptHasher,
    private readonly sessions: SessionRepository,
    private readonly cache: SessionCacheRepository,
  ) {}
  async execute(rawSessionToken: string): Promise<void> {
    const hash = await this.tokenHasher.hash(rawSessionToken, 10);
    await this.sessions.revokeByTokenHash(hash);
    await this.cache.delete(hash);
  }
}
