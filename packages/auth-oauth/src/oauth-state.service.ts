import { REDIS_TOKENS, RedisCacheService } from "@repo/cache";
import crypto from "node:crypto";

const SESSION_CACHE_TTL_SECONDS = 60 * 15; // 15 minutos

export class OAuthStateService {
  static inject = [REDIS_TOKENS.REDIS_CLIENT];

  constructor(private readonly redis: RedisCacheService) {}

  async generate(metadata?: Record<string, string>): Promise<string> {
    const state = crypto.randomBytes(24).toString("hex");
    await this.redis.set(
      this.key(state),
      JSON.stringify(metadata ?? {}),
      SESSION_CACHE_TTL_SECONDS,
    );
    return state;
  }

  async verify(state: string): Promise<Record<string, string> | null> {
    const raw = await this.redis.get(this.key(state));
    if (!raw) return null;
    await this.redis.delete(this.key(state));
    try {
      return JSON.parse(raw.toString());
    } catch {
      return null;
    }
  }

  private key(state: string): string {
    return `oauth:state:${state}`;
  }
}
