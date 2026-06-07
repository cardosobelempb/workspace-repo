import { UUIDVO } from "@repo/common";
import { EmailVerificationTokenEntity } from "../../domain/entities";
import { EmailVerificationTokenCreateDto } from "../dto";

export class EmailVerificationTokenFactory {
  static build(input: EmailVerificationTokenCreateDto): EmailVerificationTokenEntity {
    return EmailVerificationTokenEntity.create({
      userId: UUIDVO.create(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: new Date(input.expiresAt),
      usedAt: null,
    });
  }
}
