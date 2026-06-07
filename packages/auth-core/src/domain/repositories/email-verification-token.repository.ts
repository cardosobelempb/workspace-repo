import { BaseRepository } from "@repo/common";
import { EmailVerificationTokenEntity } from "../entities";

export abstract class EmailVerificationTokenRepository extends BaseRepository<EmailVerificationTokenEntity> {}
