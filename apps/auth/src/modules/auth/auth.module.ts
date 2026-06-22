// modules/auths/auth.module.ts

import { DI_REDIS, DI_REDIS_REPOSITORY, RedisSessionCacheRepository } from "@repo/cache";
import { DI_HASH, DI_TOKEN, ModuleDefinition } from "@repo/common";

import { DI_USECASE } from "./application/usecases/di-usecase";
import { SessionUseCase } from "./application/usecases/session.usecase";

import {
  DI_PRISMA,
  DI_PRISMA_REPOSITORY,
  getPrismaClient,
  PrismaSessionRepository,
  PrismaUserRepository,
} from "@repo/database";

import { RegisterUseCase } from "./application/usecases/register.usecase";
import { ComparerService } from "./domain/services/comparer.service";
import { HasherService } from "./domain/services/hasher.service";
import { RedisCacheService } from "./domain/services/redis-cache.service";
import { REPOSITORY_CONSTANTS } from "./infrastructure/database/constant";

import { JwtService } from "./domain/services/jwt.service";
import { LoginWithPasswordController } from "./infrastructure/http/controllers/login-with-password.controller";
import { RegisterController } from "./infrastructure/http/controllers/register.controller";

export const authModule: ModuleDefinition = {
  providers: [
    {
      token: DI_PRISMA.PRISMA_CLIENT,
      useValue: getPrismaClient(),
    },
    {
      token: DI_REDIS.REDIS_CLIENT,
      useValue: new RedisCacheService(),
    },
    {
      token: DI_HASH.HASH_GENERATOR,
      useClass: HasherService,
    },
    {
      token: DI_HASH.HASH_COMPARER,
      useClass: ComparerService,
    },
    {
      token: DI_TOKEN.TOKEN_GENERATOR,
      useClass: JwtService,
    },
    {
      token: DI_PRISMA_REPOSITORY.PRISMA_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      token: DI_PRISMA_REPOSITORY.PRISMA_SESSION_REPOSITORY,
      useClass: PrismaSessionRepository,
    },
    {
      token: DI_REDIS_REPOSITORY.REDIS_SESSION_CACHE_REPOSITORY,
      useClass: RedisSessionCacheRepository,
    },
    {
      token: DI_USECASE.SESSION_USECASE,
      useFactory: (
        hasherService: HasherService,
        comparerService: ComparerService,
        jwtService: JwtService,
        prismaUserRepository: PrismaUserRepository,
        prismaSessionRepository: PrismaSessionRepository,
        redisSessionCacheRepository: RedisSessionCacheRepository,
      ) =>
        new SessionUseCase(
          hasherService,
          comparerService,
          jwtService,
          prismaUserRepository,
          prismaSessionRepository,
          redisSessionCacheRepository,
        ),
      inject: [
        DI_HASH.HASH_GENERATOR,
        DI_HASH.HASH_COMPARER,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
        REPOSITORY_CONSTANTS.PRISMA_SESSION_REPOSITORY,
        REPOSITORY_CONSTANTS.REDIS_SESSION_CACHE_REPOSITORY,
      ],
    },
    {
      token: DI_USECASE.REGISTER_USECASE,
      useFactory: (
        bcryptHasherService: HasherService,
        prismaUserRepository: PrismaUserRepository,
      ) => new RegisterUseCase(bcryptHasherService, prismaUserRepository),
      inject: [
        DI_HASH.HASH_GENERATOR,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
        REPOSITORY_CONSTANTS.PRISMA_USER_PROFILE_REPOSITORY,
      ],
    },
  ],

  controllers: [RegisterController, LoginWithPasswordController],
};
