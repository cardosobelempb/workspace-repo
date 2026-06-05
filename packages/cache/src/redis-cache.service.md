import { CacheService } from "./cache.service";
import { RedisClient } from "./config/redis.client";

// ============================================================
// RedisCacheService
// ============================================================

export class RedisCacheService implements CacheService {
  async get<T>(key: string): Promise<T | null> {
    const value = await RedisClient.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await RedisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await RedisClient.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const keys = await RedisClient.keys(`${prefix}*`);

    if (!keys.length) {
      return;
    }

    await RedisClient.del(...keys);
  }
}
