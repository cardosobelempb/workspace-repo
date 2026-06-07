import { SessionRecord } from "./session.repository";

export abstract class SessionCacheRepository {
  abstract set(session: SessionRecord): Promise<void>;

  abstract get(sessionTokenHash: string): Promise<SessionRecord | null>;

  abstract delete(sessionTokenHash: string): Promise<void>;
}
