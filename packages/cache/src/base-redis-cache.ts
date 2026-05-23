import { BaseCache } from "./base-cache";
import { configRedis } from "./config/config-redis";

// ============================================================
// RedisCacheService
// ============================================================

export class BaseRedisCache implements BaseCache {
  async get<T>(key: string): Promise<T | null> {
    const value = await configRedis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await configRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await configRedis.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const keys = await configRedis.keys(`${prefix}*`);

    if (!keys.length) {
      return;
    }

    await configRedis.del(...keys);
  }
}
