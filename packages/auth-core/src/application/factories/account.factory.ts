import { EmailVO, UUIDVO } from "@repo/common";
import { AccountEntity } from "../../domain/entities/account.entity";
import { AccountCreateDto } from "../dto";

export type BuildAccountInput = {
  userId: string;
  accountToken: string;
  expires: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class AccountFactory {
  static build(input: AccountCreateDto): AccountEntity {
    return AccountEntity.create({
      userId: UUIDVO.create(input.userId),
      providerAccountId: input.providerAccountId,
      provider: input.provider,
      email: EmailVO.create(input.email),
      refreshToken: input.refreshToken,
      accessToken: input.accessToken,
      expiresAt: input.expiresAt,
    });
  }
}
