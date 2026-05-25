import { PrismaRepository } from "@repo/database";
import { UserProfileEntity } from "@/modules/user/domain/entities/user-profile.entity";

/**
 * Repositório abstrato de UserProfile.
 * Gerencia o perfil detalhado do usuário (dados pessoais, avatar, documentos).
 */
export abstract class UserProfileRepository extends PrismaRepository<UserProfileEntity> {
  // ====================== BUSCAS ======================
  abstract findByUserId(userId: string): Promise<UserProfileEntity | null>;
  abstract findByDocumentNumber(document: string): Promise<UserProfileEntity | null>;

  // ====================== EXISTÊNCIA ======================
  abstract existsByDocumentNumber(document: string): Promise<boolean>;

  // ====================== OUTROS ======================
  abstract upsert(userId: string, data: UserProfileEntity): Promise<UserProfileEntity>;
  abstract updateAvatar(userId: string, avatarUrl: string): Promise<UserProfileEntity>;
}
