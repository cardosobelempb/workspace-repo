import { SessionEntity } from "@repo/common";

import { DI_REDIS } from "../../di-redis";
import { RedisCacheRepository } from "../../redis-cache.repository";

const SESSION_CACHE_TTL_SECONDS = 60 * 15; // 15 minutos

export class RedisSessionCacheRepository implements RedisCacheRepository<SessionEntity> {
  static inject = [DI_REDIS.REDIS_CLIENT];
  // `redis` pode ser um client ioredis direto OU um RedisCacheService wrapper
  // (apps/auth). Mantemos o tipo permissivo para suportar os dois.
  constructor(private readonly redis: any) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      // Se a string não for um JSON válido, retorna null
      return null;
    }
  }
  async set<T>(
    key: string,
    value: T,
    ttlSeconds = SESSION_CACHE_TTL_SECONDS,
  ): Promise<void> {
    // Não serializar aqui nem forçar "EX": o `redis` injetado pode ser um
    // RedisCacheService (apps/auth) com assinatura (key, value, ttlSeconds)
    // ou um client ioredis direto. A versão abaixo é compatível com os dois.
    await this.redis.set(key, value, ttlSeconds);
  }
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
  async deleteByPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    stream.on("data", (keys: string[]) => {
      if (keys.length) {
        this.redis.del(...keys).catch((error: unknown) => {
          // Log de erro, mas não interrompe o processo
          console.error("Erro ao deletar chaves por prefixo:", error);
        });
      }
    });

    return new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  }
}
