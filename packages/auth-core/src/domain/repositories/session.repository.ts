export type CreateSessionInput = {
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export abstract class SessionRepository {
  abstract create(input: CreateSessionInput): Promise<SessionRecord>;

  abstract findValidByTokenHash(sessionTokenHash: string): Promise<SessionRecord | null>;

  abstract revokeByTokenHash(sessionTokenHash: string): Promise<void>;

  abstract revokeAllByUserId(userId: string): Promise<void>;
}
