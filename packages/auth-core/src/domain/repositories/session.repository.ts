import { BaseRepository } from "@repo/common";
import { SessionEntity } from "../entities";

export abstract class SessionRepository extends BaseRepository<SessionEntity> {
  abstract findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null>;
  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;
  abstract revokeAllByUserId(userId: string): Promise<void>;
}
