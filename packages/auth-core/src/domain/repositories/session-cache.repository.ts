import { RedisCacheRepository } from "@repo/common";
import { SessionEntity } from "../entities";

export abstract class SessionCacheRepository extends RedisCacheRepository<SessionEntity> {}
