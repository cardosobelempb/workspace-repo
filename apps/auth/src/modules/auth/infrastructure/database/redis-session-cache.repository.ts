import { REDIS_TOKENS } from "@repo/cache";
import { RedisCacheRepository } from "@repo/common";

import { SessionEntity } from "../../domain/entities/session.entity";
import { RedisCacheService } from "../../domain/services/redis-cache.service";

const SESSION_CACHE_TTL_SECONDS = 60 * 15; // 15 minutos

export class RedisSessionCacheRepository implements RedisCacheRepository<SessionEntity> {
  static inject = [REDIS_TOKENS.REDIS_CLIENT];
  private key(sessionTokenHash: string) {
    return `session:${sessionTokenHash}`;
  }

  constructor(private readonly cache: RedisCacheService) {}

  async set(session: SessionEntity): Promise<void> {
    const key = this.key(session.sessionToken);
    await this.cache.set(key, session, SESSION_CACHE_TTL_SECONDS);
  }
  async get(sessionTokenHash: string): Promise<SessionEntity | null> {
    const key = this.key(sessionTokenHash);
    const session = await this.cache.get<SessionEntity>(key);
    return session || null;
  }
  async delete(sessionTokenHash: string): Promise<void> {
    const key = this.key(sessionTokenHash);
    await this.cache.delete(key);
  }
}
