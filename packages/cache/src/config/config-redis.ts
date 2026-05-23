import Redis from "ioredis";

// ============================================================
// Singleton Redis
// ============================================================

declare global {
  var redis: Redis | undefined;
}

export const configRedis =
  global.redis ??
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}
