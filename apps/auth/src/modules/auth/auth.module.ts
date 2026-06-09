// modules/auths/auth.module.ts

import { REDIS_TOKENS } from "@repo/cache";
import { HASH_DI_TOKENS, ModuleDefinition, TOKEN_DI_TOKENS } from "@repo/common";

import { USECASE_CONSTANTS } from "./application/usecases/constant";
import { CreateSessionUseCase } from "./application/usecases/create-session.usecase";

import { getPrismaClient, PRISMA_TOKENS } from "@repo/database";
import { PrismaUserProfileRepository } from "../user/infrastructure/database/prisma-user-profile.repository";
import { PrismaUserRepository } from "../user/infrastructure/database/prisma-user.repository";
import { RegisterUseCase } from "./application/usecases/register.usecase";
import { BcryptComparerService } from "./domain/services/bcrypt-comparer.service";
import { BcryptGeneratorService } from "./domain/services/bcrypt-generator.service";
import { BcryptHasherService } from "./domain/services/bcrypt-hasher.service";
import { RedisCacheService } from "./domain/services/redis-cache.service";
import { REPOSITORY_CONSTANTS } from "./infrastructure/database/constant";
import { PrismaSessionRepository } from "./infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "./infrastructure/database/redis-session-cache.repository";
import { LoginController } from "./infrastructure/http/controllers/login.controller";
import { RegisterController } from "./infrastructure/http/controllers/register.controller";

export const authModule: ModuleDefinition = {
  providers: [
    {
      token: PRISMA_TOKENS.PRISMA_CLIENT,
      useValue: getPrismaClient(),
    },
    {
      token: REDIS_TOKENS.REDIS_CLIENT,
      useValue: new RedisCacheService(),
    },
    {
      token: HASH_DI_TOKENS.HASH_GENERATOR,
      useClass: BcryptHasherService,
    },
    {
      token: HASH_DI_TOKENS.HASH_COMPARER,
      useClass: BcryptComparerService,
    },
    {
      token: TOKEN_DI_TOKENS.TOKEN_GENERATOR,
      useClass: BcryptGeneratorService,
    },
    {
      token: REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      token: REPOSITORY_CONSTANTS.PRISMA_USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
    {
      token: REPOSITORY_CONSTANTS.PRISMA_SESSION_REPOSITORY,
      useClass: PrismaSessionRepository,
    },
    {
      token: REPOSITORY_CONSTANTS.REDIS_SESSION_CACHE_REPOSITORY,
      useClass: RedisSessionCacheRepository,
    },
    {
      token: USECASE_CONSTANTS.CREATE_SESSION_USECASE,
      useFactory: (
        bcryptHasherService: BcryptHasherService,
        bcryptComparerService: BcryptComparerService,
        bcryptGeneratorService: BcryptGeneratorService,
        prismaUserRepository: PrismaUserRepository,
        prismaSessionRepository: PrismaSessionRepository,
        redisSessionCacheRepository: RedisSessionCacheRepository,
      ) =>
        new CreateSessionUseCase(
          bcryptHasherService,
          bcryptComparerService,
          bcryptGeneratorService,
          prismaUserRepository,
          prismaSessionRepository,
          redisSessionCacheRepository,
        ),
      inject: [
        HASH_DI_TOKENS.HASH_GENERATOR,
        HASH_DI_TOKENS.HASH_COMPARER,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
        REPOSITORY_CONSTANTS.PRISMA_SESSION_REPOSITORY,
        REPOSITORY_CONSTANTS.REDIS_SESSION_CACHE_REPOSITORY,
      ],
    },
    {
      token: USECASE_CONSTANTS.REGISTER_USECASE,
      useFactory: (
        bcryptHasherService: BcryptHasherService,
        prismaUserRepository: PrismaUserRepository,
        prismaUserProfileRepository: PrismaUserProfileRepository,
      ) =>
        new RegisterUseCase(
          bcryptHasherService,
          prismaUserRepository,
          prismaUserProfileRepository,
        ),
      inject: [
        HASH_DI_TOKENS.HASH_GENERATOR,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
        REPOSITORY_CONSTANTS.PRISMA_USER_PROFILE_REPOSITORY,
      ],
    },
  ],

  controllers: [RegisterController, LoginController],
};
