import {
  DI_HASH,
  DI_TOKEN,
  Either,
  left,
  right,
  SessionFactory,
  UnauthorizedError,
  UserSessionDto,
  UserSessionProjectionDto,
} from "@repo/common";
import {
  DI_PRISMA_REPOSITORY,
  PrismaSessionRepository,
  PrismaUserRepository,
} from "@repo/database";
import { ComparerService } from "../../domain/services/comparer.service";
import { HasherService } from "../../domain/services/hasher.service";
import { JwtService } from "../../domain/services/jwt.service";

import { DI_REDIS_REPOSITORY, RedisSessionCacheRepository } from "@repo/cache";

export type SessionUseCaseResponse = Either<UnauthorizedError, UserSessionProjectionDto>;

export class SessionUseCase {
  static inject = [
    DI_HASH.HASH_GENERATOR,
    DI_HASH.HASH_COMPARER,
    DI_TOKEN.TOKEN_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
    DI_PRISMA_REPOSITORY.PRISMA_SESSION_REPOSITORY,
    DI_REDIS_REPOSITORY.REDIS_SESSION_CACHE_REPOSITORY,
  ];

  constructor(
    private readonly hasherService: HasherService,
    private readonly comparerService: ComparerService,
    private readonly jwtService: JwtService,
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
    input: UserSessionDto,
    metadata: {
      ipAddress: string | null;
      userAgent: string | null;
    },
  ): Promise<SessionUseCaseResponse> {
    const user = await this.prismaUserRepository.findActiveByEmail(input.email);

    if (!user) {
      return left(
        new UnauthorizedError({
          fieldName: "email",
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
          fieldName: "password",
          message: "Credenciais inválidas.",
        }),
      );
    }

    const sessionToken = await this.jwtService.generate({
      sub: user.id.getValue(),
      email: user.email.getValue().value,
    });

    const sessionTokenHash = await this.hasherService.hash(sessionToken);

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

    await this.redisSessionCacheRepository.set(
      session.id.getValue(),
      session.userId,
      Math.floor((session.expires.getTime() - Date.now()) / 1000),
    );

    return right({
      user: {
        id: user.id.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email.getValue().value,
        createdAt: user.createdAt,
      },
      accessToken: sessionToken,
      refreshToken: sessionToken,
      expiresAt,
    });
  }
}
