import { RootRepository } from "@/common/shared/domain";
import { SessionEntity } from "../entities";

export abstract class SessionRepository extends RootRepository<SessionEntity> {
  abstract findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null>;
  abstract revokeAllByUserId(userId: string): Promise<void>;
  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;
  abstract findActiveByUserId(userId: string): Promise<SessionEntity[]>;
  abstract findBySessionToken(sessionToken: string): Promise<SessionEntity | null>;
  abstract revoke(sessionId: string): Promise<void>;
}
