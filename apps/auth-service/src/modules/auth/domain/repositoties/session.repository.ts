import { SessionEntity } from "@/modules/auth/domain/entities/session.entity";
import { BaseRepository } from "@repo/common";

export abstract class SessionRepository extends BaseRepository<SessionEntity> {
  abstract create(input: SessionEntity): Promise<SessionEntity>;
  abstract findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null>;
  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;
  abstract revokeAllByUserId(userId: string): Promise<void>;
  abstract findBySessionToken(sessionToken: string): Promise<SessionEntity | null>;
  abstract findActiveByUserId(userId: string): Promise<SessionEntity[]>;
  abstract revoke(sessionId: string): Promise<void>;
}
