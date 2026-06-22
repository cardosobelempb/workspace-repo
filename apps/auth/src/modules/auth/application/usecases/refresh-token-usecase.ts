import {
  DI_HASH,
  DI_TOKEN,
  Either,
  left,
  right,
  TokenFactory,
  TokenType,
  UnauthorizedError,
  UserSessionDto,
  UserSessionProjectionDto,
} from "@repo/common";
import {
  DI_PRISMA_REPOSITORY,
  PrismaTokenRepository,
  PrismaUserRepository,
} from "@repo/database";
import { HasherService } from "../../domain/services/hasher.service";
import { JwtService } from "../../domain/services/jwt.service";

export type RefreshTokenUseCaseResponse = Either<
  UnauthorizedError,
  UserSessionProjectionDto
>;

export class RefreshTokenUseCase {
  static inject = [
    DI_HASH.HASH_GENERATOR,
    DI_TOKEN.TOKEN_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
    DI_PRISMA_REPOSITORY.PRISMA_TOKEN_REPOSITORY,
  ];

  constructor(
    private readonly hasherService: HasherService,
    private readonly jwtService: JwtService,
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
    input: UserSessionDto,
    metadata: {
      ipAddress: string;
      userAgent: string;
    },
  ): Promise<RefreshTokenUseCaseResponse> {
    const refreshTokenHash = await this.hasherService.hash(input.password);

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

    const accessToken = await this.jwtService.generate({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const newRefreshToken = await this.jwtService.generate({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });
    const newRefreshTokenHash = await this.hasherService.hash(newRefreshToken);

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
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiredAt,
    });
  }
}
