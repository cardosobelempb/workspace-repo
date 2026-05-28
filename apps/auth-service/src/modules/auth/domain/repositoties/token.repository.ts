import { TokenEntity } from "@/modules/auth/domain/entities/token.entity";
import { TokenType } from "@repo/common";
import { PrismaDatabase, PrismaRepository } from "@repo/database";

/**
 * Repositório abstrato de Token.
 * Gerencia tokens internos (refresh, reset password, API keys, etc).
 */
export abstract class TokenRepository extends PrismaRepository<TokenEntity> {
  constructor(prisma: PrismaDatabase) {
    super(prisma);
  }
  // ====================== BUSCAS ======================
  abstract findValidByUserAndType(
    userId: string,
    type: TokenType,
  ): Promise<TokenEntity | null>;
  abstract findByValueHash(valueHash: string): Promise<TokenEntity | null>;

  // ====================== OUTROS ======================
  abstract revokeToken(valueHash: string): Promise<void>;
  abstract revokeAllByUser(userId: string): Promise<void>;
  abstract expireToken(id: string): Promise<void>;
  abstract findValidByHash(params: {
    valueHash: string;
    type: TokenType;
  }): Promise<TokenEntity | null>;
  abstract revokeById(tokenId: string): Promise<void>;
  abstract revokeAllByUserId(userId: string, type?: TokenType): Promise<void>;
  abstract deleteExpired(): Promise<number>;
  abstract createRefreshToken(entity: TokenEntity): Promise<void>;
  abstract findValidRefreshToken(valueHash: string): Promise<TokenEntity | null>;
  abstract revokeRefreshToken(id: string): Promise<void>;
}
