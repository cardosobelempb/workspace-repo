import { BaseRepository } from "@repo/common";
import { UserEntity } from "../entities";

export abstract class UserRepository extends BaseRepository<UserEntity> {
  abstract findActiveByEmail(email: string): Promise<UserEntity | null>;
  abstract findActiveById(id: string): Promise<UserEntity | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
}
