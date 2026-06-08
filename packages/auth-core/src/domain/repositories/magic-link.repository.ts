import { BaseRepository } from "@repo/common";
import { MagicLinkTokenEntity } from "../entities";

export abstract class MagicLinkRepository extends BaseRepository<MagicLinkTokenEntity> {
  abstract findValidByTokenHash(tokenHash: string): Promise<MagicLinkTokenEntity | null>;
  abstract markUsed(id: string, usedAt: Date): Promise<void>;
  abstract invalidateAllByEmail(email: string): Promise<void>;
}
