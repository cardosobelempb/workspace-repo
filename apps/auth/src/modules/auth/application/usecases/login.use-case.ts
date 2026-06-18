import { envAuth } from "@/config/env-auth";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  BadRequestError,
  DI_HASH,
  DI_TOKEN,
  Either,
  left,
  right,
  TokenType,
  UnauthorizedError,
} from "@repo/common";
import { DI_PRISMA_REPOSITORY } from "@repo/database";
import { BcryptComparerService } from "../../domain/services/bcrypt-comparer.service";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";
import { JwtEncrypterService } from "../../domain/services/jwt-encrypter.service";
import { REPOSITORY_CONSTANTS } from "../../infrastructure/database/constant";
import { PrismaTokenRepository } from "../../infrastructure/database/prisma-token.repository";
import { AuthProjectionDto, LoginDto } from "../dto/auth.dto";
import { TokenFactory } from "../factories/token.factory";

export type CreateSessionUseCaseResponse = Either<BadRequestError, AuthProjectionDto>;

export class LogoutUseCase {
  static inject = [
    DI_HASH.HASH_COMPARER,
    DI_HASH.HASH_COMPARER,
    DI_TOKEN.TOKEN_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
    REPOSITORY_CONSTANTS.PRISMA_TOKEN_REPOSITORY,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly bcryptComparerService: BcryptComparerService,
    private readonly jwtEncrypterService: JwtEncrypterService,
    private readonly prismaUserRepository: PrismaUserRepository,
    private readonly prismaTokenRepository: PrismaTokenRepository,
  ) {}

  /**
   * Revoga a sessão atual imediatamente.
   *
   * Remove do Redis e marca como deletada no PostgreSQL.
   */
  async execute(
    input: LoginDto,
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

    const passwordMatches = await this.bcryptComparerService.compare(
      input.password,
      user.password.getValue(),
    );

    if (!passwordMatches) {
      return left(
        new UnauthorizedError({
          fieldName: "",
          message: "Credenciais inválidas.",
        }),
      );
    }

    const accessToken = await this.jwtEncrypterService.createAsyncAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const refreshToken = await this.jwtEncrypterService.createAsyncRefreshToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });
    const refreshTokenHash = await this.bcryptHasherService.hash(refreshToken);

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
        email: user.email.getValue().value,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresAt: expiredAt,
    });
  }
}
