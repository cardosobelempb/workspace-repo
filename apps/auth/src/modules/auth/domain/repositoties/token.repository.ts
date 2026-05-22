import { BaseRepository, TokenType } from "@repo/common";
import { TokenEntity } from "../entities/token.entity";

/**
 * Repositório abstrato de Token.
 * Gerencia tokens internos (refresh, reset password, API keys, etc).
 */
export abstract class TokenRepository extends BaseRepository<TokenEntity> {
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
}
