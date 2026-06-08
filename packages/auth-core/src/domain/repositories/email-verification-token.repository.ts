import { BaseRepository } from "@repo/common";
import { EmailVerificationTokenEntity } from "../entities";

export abstract class EmailVerificationTokenRepository extends BaseRepository<EmailVerificationTokenEntity> {
  abstract findValidByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenEntity | null>;
  abstract markUsed(id: string, usedAt: Date): Promise<void>;
  abstract invalidateAllByUserId(userId: string): Promise<void>;
}
