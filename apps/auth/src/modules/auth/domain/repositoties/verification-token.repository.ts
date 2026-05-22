import { BaseRepository } from "@repo/common";
import { VerificationTokenEntity } from "../entities/verification-token.entity";

export abstract class VerificationTokenRepository extends BaseRepository<VerificationTokenEntity> {}
