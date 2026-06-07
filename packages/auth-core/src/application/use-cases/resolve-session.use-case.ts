import { BcryptHasher } from "@repo/common";
import { AUTH_DI_TOKENS, AUTH_TOKEN_CONSTANTS } from "../../constants";
import { SessionEntity } from "../../domain/entities/session.entity";
import { SessionCacheRepository } from "../../domain/repositories/session-cache.repository";
import { SessionRepository } from "../../domain/repositories/session.repository";

export class ResolveSessionUseCase {
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
  async execute(rawSessionToken: string): Promise<SessionEntity | null> {
    const hash = await this.tokenHasher.hash(
      rawSessionToken,
      AUTH_TOKEN_CONSTANTS.SESSION_TOKEN_SALT_ROUNDS,
    );
    const cached = await this.cache.get(hash);
    if (cached && !cached.isExpired()) return cached;
    const session = await this.sessions.findValidByTokenHash(hash);
    if (session) await this.cache.set(session);
    return session;
  }
}
