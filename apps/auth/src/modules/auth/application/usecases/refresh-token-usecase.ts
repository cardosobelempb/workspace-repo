import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  CRYPTOGRAPHY_TOKENS,
  Either,
  JWT_TOKENS,
  left,
  right,
  TokenType,
  UnauthorizedError,
} from "@repo/common";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";
import { JwtEncrypterService } from "../../domain/services/jwt-encrypter.service";
import { REPOSITORY_CONSTANTS } from "../../infrastructure/database/constant";
import { PrismaTokenRepository } from "../../infrastructure/database/prisma-token.repository";
import { AuthProjectionDto, RefreshTokenDto } from "../dto/auth.dto";
import { TokenFactory } from "../factories/token.factory";

export type RefreshTokenUseCaseResponse = Either<UnauthorizedError, AuthProjectionDto>;

export class RefreshTokenUseCase {
  static inject = [
    CRYPTOGRAPHY_TOKENS.BCRYPT_HASHER,
    JWT_TOKENS.JWT_ENCRYPTER,
    REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
    REPOSITORY_CONSTANTS.PRISMA_TOKEN_REPOSITORY,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly jwtEncrypterService: JwtEncrypterService,
    private readonly prismaUserRepository: PrismaUserRepository,
    private readonly prismaTokenRepository: PrismaTokenRepository,
  ) {}

  /**
   * Renova tokens a partir de um refresh token válido.
   *
   * Estratégia de segurança:
   * - Revoga o refresh token antigo.
   * - Gera um novo refresh token.
   * - Gera um novo access token.
   */
  async execute(
    input: RefreshTokenDto,
    metadata: {
      ipAddress: string;
      userAgent: string;
    },
  ): Promise<RefreshTokenUseCaseResponse> {
    const refreshTokenHash = await this.bcryptHasherService.hash(input.type);

    const storedToken =
      await this.prismaTokenRepository.findValidRefreshToken(refreshTokenHash);

    if (!storedToken) {
      return left(
        new UnauthorizedError({
          fieldName: "",
          message: "Refresh token inválido ou expirado.",
        }),
      );
    }

    const user = await this.prismaUserRepository.findActiveById(
      storedToken.userId.getValue(),
    );

    if (!user) {
      return left(
        new UnauthorizedError({
          fieldName: "",
          message: "Usuário associado ao refresh token não encontrado ou inativo.",
        }),
      );
    }

    await this.prismaTokenRepository.revokeRefreshToken(storedToken.id.getValue());

    const accessToken = await this.jwtEncrypterService.createAsyncAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const newRefreshToken = await this.jwtEncrypterService.createAsyncRefreshToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });
    const newRefreshTokenHash = await this.bcryptHasherService.hash(newRefreshToken);

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    const tokenEnttity = TokenFactory.build({
      userId: user.id.getValue(),
      type: TokenType.REFRESH,
      valueHash: newRefreshTokenHash,
      expiredAt,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      revokedAt: null,
    });

    await this.prismaTokenRepository.createRefreshToken(tokenEnttity);

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiredAt,
    });
  }
}
