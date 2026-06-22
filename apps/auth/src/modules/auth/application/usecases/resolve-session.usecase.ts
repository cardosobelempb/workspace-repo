import { DI_REDIS_REPOSITORY } from "@repo/cache";
import {
  BadRequestError,
  DI_HASH,
  Either,
  left,
  right,
  SessionProjectionDto,
} from "@repo/common";
import { DI_PRISMA_REPOSITORY } from "@repo/database";
import { HasherService } from "../../domain/services/hasher.service";
import { PrismaSessionRepository } from "../../infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "../../infrastructure/database/redis-session-cache.repository";
import { PrismaSessionMapper } from "../../infrastructure/mappers/session.mapper";

export type CreateSessionUseCaseResponse = Either<
  BadRequestError,
  { session: SessionProjectionDto }
>;

export class ResolveSessionUseCase {
  static inject = [
    DI_HASH.HASH_GENERATOR,
    DI_PRISMA_REPOSITORY.PRISMA_SESSION_REPOSITORY,
    DI_REDIS_REPOSITORY.REDIS_SESSION_CACHE_REPOSITORY,
  ];

  constructor(
    private readonly hasherService: HasherService,
    private readonly prismaSessionRepository: PrismaSessionRepository,
    private readonly redisSessionCacheRepository: RedisSessionCacheRepository,
  ) {}

  /**
   * Resolve uma sessão a partir do token puro recebido no cookie/header.
   *
   * Estratégia:
   * - Hash do token puro.
   * - Busca no Redis.
   * - Cache miss: busca no PostgreSQL.
   * - Se existir no banco, recarrega o Redis.
   */
  async execute(sessionToken: string): Promise<CreateSessionUseCaseResponse | null> {
    const sessionTokenHash = await this.hasherService.hash(sessionToken);

    const cached = await this.redisSessionCacheRepository.get(sessionTokenHash);

    console.log("ResolveSessionUseCase: Cache lookup", {
      sessionTokenHash,
      cacheHit: !!cached,
      cacheExpired: cached ? cached.expires <= new Date() : null,
    });

    if (cached && cached.expires > new Date()) {
      return left(
        new BadRequestError({
          fieldName: "sessionToken",
          message: "Sessão já está ativa no cache. Use o token para autenticar.",
        }),
      );
    }

    const session =
      await this.prismaSessionRepository.findValidByTokenHash(sessionTokenHash);

    console.log("ResolveSessionUseCase: Database lookup", {
      sessionTokenHash,
      sessionFound: !!session,
      sessionExpired: session ? session.isExpired() : null,
    });

    if (!session) {
      await this.redisSessionCacheRepository.get(sessionTokenHash);
      return null;
    }

    await this.redisSessionCacheRepository.set(session);

    return right({ session: PrismaSessionMapper.toDTO(session) });
  }
}
