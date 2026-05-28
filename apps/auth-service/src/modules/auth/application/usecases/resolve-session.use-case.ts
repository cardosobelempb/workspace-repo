import { BcryptHasherService } from "@/modules/auth/domain/services/bcrypt-hasher.service";
import { BadRequestError, Either, left, right } from "@repo/common";
import { PrismaSessionRepository } from "../../infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "../../infrastructure/database/redis-session-cache.repository";
import { PrismaSessionMapper } from "../../infrastructure/mappers/session.mapper";
import { SessionProjectionDto } from "../dto/session.dto";

export type CreateSessionUseCaseResponse = Either<
  BadRequestError,
  { session: SessionProjectionDto }
>;

export class ResolveSessionUseCase {
  static inject = [
    BcryptHasherService,
    PrismaSessionRepository,
    RedisSessionCacheRepository,
  ];

  constructor(
    private readonly bcryptHasherService: BcryptHasherService,
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
    const sessionTokenHash = await this.bcryptHasherService.hash(sessionToken);

    const cached =
      await this.redisSessionCacheRepository.findBySessionToken(sessionTokenHash);

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

    if (!session) {
      await this.redisSessionCacheRepository.revoke(sessionTokenHash);
      return null;
    }

    await this.redisSessionCacheRepository.create(session);

    return right({ session: PrismaSessionMapper.toDTO(session) });
  }
}
