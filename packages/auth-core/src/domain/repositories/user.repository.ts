import { BaseRepository } from "@repo/common";
import { UserEntity } from "../entities";

export abstract class UserRepository extends BaseRepository<UserEntity> {
  abstract findActiveByEmail(email: string): Promise<UserEntity | null>;
  abstract findActiveById(id: string): Promise<UserEntity | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract markEmailVerified(userId: string, verifiedAt: Date): Promise<void>;
  abstract softDelete(userId: string): Promise<void>;
}
