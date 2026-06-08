import { BaseRepository } from "@repo/common";
import { AccountEntity } from "../entities";

export abstract class AccountRepository extends BaseRepository<AccountEntity> {
  abstract findByProvider(
    provider: string,
    providerAccountId: string,
  ): Promise<AccountEntity | null>;
  abstract findAllByUserId(userId: string): Promise<AccountEntity[]>;
}
