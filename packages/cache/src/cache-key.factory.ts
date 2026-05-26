export class CacheKeyFactory {
  // sessions cache keys
  static sessionById(id: string) {
    return `sessions:id:${id}`;
  }
  // sessions:exists:id:{id} => boolean
  static sessionByTokenHash(tokenHash: string) {
    return `sessions:token:${tokenHash}`;
  }
  // sessions:user:{userId}:active => SessionEntity[]
  static sessionExistsById(id: string) {
    return `sessions:exists:id:${id}`;
  }
  // sessions:user:{userId}:active => SessionEntity[]
  static sessionsActiveByUserId(userId: string) {
    return `sessions:user:${userId}:active`;
  }

  static sessionsPrefix() {
    return "sessions:";
  }
}
