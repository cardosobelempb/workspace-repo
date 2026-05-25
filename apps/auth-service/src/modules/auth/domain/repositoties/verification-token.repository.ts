import { BaseRepository } from "@repo/common";
import { VerificationTokenEntity } from "@/modules/auth/domain/entities/verification-token.entity";

export abstract class VerificationTokenRepository extends BaseRepository<VerificationTokenEntity> {}
