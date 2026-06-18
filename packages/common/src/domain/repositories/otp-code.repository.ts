import { RootRepository } from "@/common/shared/domain";
import { OtpCodeEntity } from "../entities";

export abstract class OtpCodeRepository extends RootRepository<OtpCodeEntity> {}
