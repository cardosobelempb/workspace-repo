import { BcryptHasherService } from "@/modules/auth/domain/services/bcrypt-hasher.service";
import { BadRequestError, Either, left, right } from "@repo/common";
import { PrismaSessionRepository } from "../../infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "../../infrastructure/database/redis-session-cache.repository";

export type CreateSessionUseCaseResponse = Either<BadRequestError, void>;

export class LogoutUseCase {
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
   * Revoga a sessão atual imediatamente.
   *
   * Remove do Redis e marca como deletada no PostgreSQL.
   */
  async execute(sessionToken: string): Promise<CreateSessionUseCaseResponse> {
    const sessionTokenHash = await this.bcryptHasherService.hash(sessionToken);

    if (!sessionTokenHash) {
      return left(
        new BadRequestError({
          fieldName: "sessionToken",
          message: "Sessão inválida ou já revogada.",
        }),
      );
    }

    await this.prismaSessionRepository.revokeByTokenHash(sessionTokenHash);
    await this.redisSessionCacheRepository.delete(sessionTokenHash);

    return right(undefined);
  }
}
