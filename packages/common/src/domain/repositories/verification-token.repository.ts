import { RootRepository } from "@/common/shared/domain";
import { VerificationTokenEntity } from "../entities";

export abstract class VerificationTokenRepository extends RootRepository<VerificationTokenEntity> {}
