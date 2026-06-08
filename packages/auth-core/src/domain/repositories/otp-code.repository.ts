import { BaseRepository } from "@repo/common";
import { OtpCodeEntity } from "../entities";

export abstract class OtpCodeRepository extends BaseRepository<OtpCodeEntity> {
  abstract findValidByEmailAndPurpose(
    email: string,
    purpose: string,
  ): Promise<OtpCodeEntity | null>;
  abstract incrementAttempts(id: string): Promise<void>;
  abstract markUsed(id: string, usedAt: Date): Promise<void>;
  abstract invalidateAllByEmailAndPurpose(email: string, purpose: string): Promise<void>;
}
