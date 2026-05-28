import { BcryptHasherService } from "@/modules/auth/domain/services/bcrypt-hasher.service";
import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import { Either, left, right, UnauthorizedError } from "@repo/common";
import { BcryptComparerService } from "../../domain/services/bcrypt-comparer.service";
import { BcryptGeneratorService } from "../../domain/services/bcrypt-generator.service";
import { PrismaSessionRepository } from "../../infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "../../infrastructure/database/redis-session-cache.repository";
import { AuthProjectionDto, LoginDto } from "../dto/auth.dto";
import { SessionFactory } from "../factories/session.factory";

export type CreateSessionUseCaseResponse = Either<UnauthorizedError, AuthProjectionDto>;

export class CreateSessionUseCase {
  static inject = [
    BcryptHasherService,
    BcryptComparerService,
    BcryptGeneratorService,
    PrismaUserRepository,
    PrismaSessionRepository,
    RedisSessionCacheRepository,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
    private readonly bcryptComparerService: BcryptComparerService,
    private readonly bcryptGeneratorService: BcryptGeneratorService,
    private readonly prismaUserRepository: PrismaUserRepository,
    private readonly prismaSessionRepository: PrismaSessionRepository,
    private readonly redisSessionCacheRepository: RedisSessionCacheRepository,
  ) {}

  /**
   * Cria uma sessão autenticada.
   *
   * Passos:
   * 1. Busca usuário ativo por e-mail.
   * 2. Compara senha enviada com hash salvo.
   * 3. Gera sessionToken opaco.
   * 4. Salva hash da sessão no PostgreSQL.
   * 5. Salva cópia da sessão no Redis.
   * 6. Retorna sessionToken puro apenas para o cookie httpOnly.
   */
  async execute(
    input: LoginDto,
    metadata: {
      ipAddress: string | null;
      userAgent: string | null;
    },
  ): Promise<CreateSessionUseCaseResponse> {
    const user = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (!user) {
      return left(
        new UnauthorizedError({
          fieldName: "email",
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
          fieldName: "password",
          message: "Credenciais inválidas.",
        }),
      );
    }

    const sessionToken = await this.bcryptHasherService.generate();
    const sessionTokenHash = await this.bcryptGeneratorService.hash(sessionToken);

    const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const sessionEntity = SessionFactory.build({
      userId: user.id.getValue(),
      sessionToken: sessionTokenHash,
      expires: expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    const session = await this.prismaSessionRepository.create(sessionEntity);

    await this.redisSessionCacheRepository.set(session);

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        emailVerified: user.emailVerified,
      },
      accessToken: sessionToken,
      refreshToken: sessionToken,
      expiresAt: session.expires,
    });
  }
}
