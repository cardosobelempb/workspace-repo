import Redis from "ioredis";
import { envRedis } from "./env-redis";

// ============================================================
// Singleton Redis
// ============================================================

declare global {
  var redis: Redis | undefined;
}

export const RedisClient =
  global.redis ??
  new Redis(envRedis.REDIS_URL, {
    host: envRedis.REDIS_HOST,
    port: Number(envRedis.REDIS_PORT),
    password: envRedis.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.redis = RedisClient;
}
