import { BcryptHasherService } from "@/modules/auth/domain/services/bcrypt-hasher.service";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  BadRequestError,
  Either,
  left,
  right,
  TokenType,
  UnauthorizedError,
} from "@repo/common";
import { BcryptComparerService } from "../../domain/services/bcrypt-comparer.service";
import { JwtEncrypterService } from "../../domain/services/jwt-encrypter.service";
import { PrismaSessionRepository } from "../../infrastructure/database/prisma-session.repository";
import { PrismaTokenRepository } from "../../infrastructure/database/prisma-token.repository";
import { AuthProjectionDto, LoginDto } from "../dto/auth.dto";
import { TokenFactory } from "../factories/token.factory";

export type CreateSessionUseCaseResponse = Either<BadRequestError, AuthProjectionDto>;

export class LogoutUseCase {
  static inject = [BcryptHasherService, JwtEncrypterService, PrismaSessionRepository];

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

    const accessToken = await this.jwtEncrypterService.createAsyncAccessToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const refreshToken = await this.jwtEncrypterService.createAsyncRefreshToken({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });
    const refreshTokenHash = await this.bcryptHasherService.hash(refreshToken);

    const expiresInDays = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
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
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
      expiresAt: expiredAt,
    });
  }
}
