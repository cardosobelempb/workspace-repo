// modules/auths/auth.module.ts

import { DI_REDIS, DI_REDIS_REPOSITORY, RedisSessionCacheRepository } from "@repo/cache";
import { DI_HASH, DI_TOKEN, ModuleDefinition } from "@repo/common";

import { CreateSessionUseCase } from "./application/usecases/create-session.usecase";
import { DI_USECASE } from "./application/usecases/di-usecase";

import {
  DI_PRISMA,
  DI_PRISMA_REPOSITORY,
  getPrismaClient,
  PrismaSessionRepository,
} from "@repo/database";
import { PrismaUserRepository } from "../user/infrastructure/database/prisma-user.repository";
import { RegisterUseCase } from "./application/usecases/register.usecase";
import { BcryptComparerService } from "./domain/services/bcrypt-comparer.service";
import { BcryptGeneratorService } from "./domain/services/bcrypt-generator.service";
import { BcryptHasherService } from "./domain/services/bcrypt-hasher.service";
import { RedisCacheService } from "./domain/services/redis-cache.service";
import { REPOSITORY_CONSTANTS } from "./infrastructure/database/constant";

import { LoginController } from "./infrastructure/http/controllers/login.controller";
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
      useClass: BcryptHasherService,
    },
    {
      token: DI_HASH.HASH_COMPARER,
      useClass: BcryptComparerService,
    },
    {
      token: DI_TOKEN.TOKEN_GENERATOR,
      useClass: BcryptGeneratorService,
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
      token: DI_USECASE.CREATE_SESSION_USECASE,
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
        bcryptHasherService: BcryptHasherService,
        prismaUserRepository: PrismaUserRepository,
      ) => new RegisterUseCase(bcryptHasherService, prismaUserRepository),
      inject: [
        DI_HASH.HASH_GENERATOR,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
        REPOSITORY_CONSTANTS.PRISMA_USER_PROFILE_REPOSITORY,
      ],
    },
  ],

  controllers: [RegisterController, LoginController],
};
