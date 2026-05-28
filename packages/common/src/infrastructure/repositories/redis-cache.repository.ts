export abstract class RedisCacheRepository<T> {
  abstract set(session: T): Promise<void>;
  abstract get(sessionTokenHash: string): Promise<T | null>;
  abstract delete(sessionTokenHash: string): Promise<void>;
}
