export abstract class RedisCacheRepository<T> {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract deleteByPrefix(prefix: string): Promise<void>;
}
