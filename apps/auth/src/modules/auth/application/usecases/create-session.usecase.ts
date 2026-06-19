import { PrismaUserRepository } from "@/modules/user/infrastructure/database/prisma-user.repository";
import {
  DI_HASH,
  DI_TOKEN,
  Either,
  left,
  right,
  SessionFactory,
  UnauthorizedError,
} from "@repo/common";
import { DI_PRISMA_REPOSITORY, PrismaSessionRepository } from "@repo/database";
import { BcryptComparerService } from "../../domain/services/bcrypt-comparer.service";
import { BcryptGeneratorService } from "../../domain/services/bcrypt-generator.service";
import { BcryptHasherService } from "../../domain/services/bcrypt-hasher.service";

import { DI_REDIS_REPOSITORY, RedisSessionCacheRepository } from "@repo/cache";
import { AuthProjectionDto, LoginDto } from "../dto/auth.dto";

export type CreateSessionUseCaseResponse = Either<UnauthorizedError, AuthProjectionDto>;

export class CreateSessionUseCase {
  static inject = [
    DI_HASH.HASH_GENERATOR,
    DI_HASH.HASH_GENERATOR,
    DI_TOKEN.TOKEN_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
    DI_PRISMA_REPOSITORY.PRISMA_SESSION_REPOSITORY,
    DI_REDIS_REPOSITORY.REDIS_SESSION_CACHE_REPOSITORY,
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
      user.password.getValue(),
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

    await this.redisSessionCacheRepository.set(
      session.id.getValue(),
      session.userId,
      session.expires.getTime(),
    );

    return right({
      user: {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        createdAt: user.createdAt,
      },
      accessToken: sessionToken,
      refreshToken: sessionToken,
      expiresAt,
    });
  }
}
