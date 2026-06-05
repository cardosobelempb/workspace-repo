import { SessionEntity } from "@/modules/auth/domain/entities/session.entity";
import { PrismaDatabase, PrismaRepository } from "@repo/database";

export abstract class SessionRepository extends PrismaRepository<SessionEntity> {
  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  abstract findValidByTokenHash(sessionTokenHash: string): Promise<SessionEntity | null>;
  abstract revokeAllByUserId(userId: string): Promise<void>;
  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;
  abstract findActiveByUserId(userId: string): Promise<SessionEntity[]>;
  abstract findBySessionToken(sessionToken: string): Promise<SessionEntity | null>;
  abstract revoke(sessionId: string): Promise<void>;
}
