import { EmailVO, IpAddressVO, UserAgentVO } from "@repo/common";
import { OtpCodeEntity } from "../../domain/entities/otp-code.entity";
import { OtpCodeCreateDto } from "../dto";

export class OtpCodeFactory {
  static build(input: OtpCodeCreateDto): OtpCodeEntity {
    return OtpCodeEntity.create({
      email: EmailVO.create(input.email),
      codeHash: input.codeHash,
      purpose: "authentication", // You can adjust this as needed
      attempts: 0,
      maxAttempts: 5, // You can adjust this as needed
      expiredAt: new Date(input.expiredAt),
      ipAddress: input.ipAddress ? IpAddressVO.create(input.ipAddress) : null,
      userAgent: input.userAgent ? UserAgentVO.create(input.userAgent) : null,
    });
  }
}
