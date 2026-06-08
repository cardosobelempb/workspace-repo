import { EmailVO, IpAddressVO, UserAgentVO } from "@repo/common";
import { MagicLinkTokenEntity } from "../../domain/entities";
import { MagicLinkTokenCreateDto } from "../dto";

export class MagicLinkTokenFactory {
  static build(input: MagicLinkTokenCreateDto): MagicLinkTokenEntity {
    return MagicLinkTokenEntity.create({
      email: EmailVO.create(input.email),
      tokenHash: input.tokenHash,
      ipAddress: IpAddressVO.create(input.ipAddress) ?? null,
      userAgent: UserAgentVO.create(input.userAgent) ?? null,
      expiresAt: new Date(input.expiresAt),
      usedAt: input.usedAt ? new Date(input.usedAt) : null,
    });
  }
}
