import { envAuth } from "@/config/env-auth";
import {
  BadRequestError,
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
import { ComparerService } from "../../domain/services/comparer.service";
import { HasherService } from "../../domain/services/hasher.service";
import { JwtService } from "../../domain/services/jwt.service";

export type CreateSessionUseCaseResponse = Either<
  BadRequestError,
  UserSessionProjectionDto
>;

export class LogoutUseCase {
  static inject = [
    DI_HASH.HASH_COMPARER,
    DI_HASH.HASH_COMPARER,
    DI_TOKEN.TOKEN_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
    DI_PRISMA_REPOSITORY.PRISMA_TOKEN_REPOSITORY,
  ];

  constructor(
    private readonly hasherService: HasherService,
    private readonly comparerService: ComparerService,
    private readonly jwtService: JwtService,
    private readonly prismaUserRepository: PrismaUserRepository,
    private readonly prismaTokenRepository: PrismaTokenRepository,
  ) {}

  /**
   * Revoga a sessão atual imediatamente.
   *
   * Remove do Redis e marca como deletada no PostgreSQL.
   */
  async execute(
    input: UserSessionDto,
    metadata: {
      ipAddress: string;
      userAgent: string;
    },
  ): Promise<CreateSessionUseCaseResponse> {
    const user = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (!user) {
      return left(
        new UnauthorizedError({
          fieldName: "",
          message: "Credenciais inválidas.",
        }),
      );
    }

    const passwordMatches = await this.comparerService.compare(
      input.password,
      user.passwordHash.getValue(),
    );

    if (!passwordMatches) {
      return left(
        new UnauthorizedError({
          fieldName: "",
          message: "Credenciais inválidas.",
        }),
      );
    }

    const accessToken = await this.jwtService.generate({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const refreshToken = await this.jwtService.generate({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });
    const refreshTokenHash = await this.hasherService.hash(refreshToken);

    const expiresInDays = Number(envAuth.REFRESH_TOKEN_EXPIRES_IN ?? 7);
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + expiresInDays);

    const tokenEnttity = TokenFactory.build({
      userId: user.id.getValue(),
      type: TokenType.REFRESH,
      valueHash: refreshTokenHash,
      expiredAt,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      revokedAt: null,
    });
    await this.prismaTokenRepository.createRefreshToken(tokenEnttity);

    return right({
      user: {
        id: user.id.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email.getValue().value,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresAt: expiredAt,
    });
  }
}
