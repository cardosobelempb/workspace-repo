import { CacheService } from "./cache.service";

type CacheItem = {
  value: unknown;
  expiresAt: number;
};

export class MemoryCacheService implements CacheService {
  private readonly store = new Map<string, CacheItem>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}
