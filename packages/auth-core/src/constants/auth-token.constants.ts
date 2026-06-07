/** Constantes funcionais de tokens/sessão. */
export const AUTH_TOKEN_CONSTANTS = {
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? "sid",
  SESSION_TTL_SECONDS: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7),
  SESSION_CACHE_TTL_SECONDS: Number(process.env.SESSION_CACHE_TTL_SECONDS ?? 60 * 15),
  SESSION_TOKEN_BYTES: Number(process.env.SESSION_TOKEN_BYTES ?? 64),
  SESSION_TOKEN_HASH_ALGORITHM: "sha256",
  SESSION_TOKEN_HASH_ENCODING: "hex",
  COOKIE_SAME_SITE: "lax" as const,
  COOKIE_PATH: "/",
  COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE === "true",
  SESSION_TOKEN_SALT_ROUNDS: Number(process.env.SESSION_TOKEN_SALT_ROUNDS ?? 12),
} as const;
