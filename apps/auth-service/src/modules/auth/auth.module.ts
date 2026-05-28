// modules/auths/auth.module.ts

import { ModuleDefinition, TOKENS } from "@repo/common";

import { USECASE_CONSTANTS } from "./application/usecases/constant";
import { CreateSessionUseCase } from "./application/usecases/create-session.usecase";

import { RedisClient } from "@repo/cache";
import { getPrismaClient } from "@repo/database";
import { PrismaUserRepository } from "../user/infrastructure/database/prisma-user.repository";
import { RegisterUseCase } from "./application/usecases/register.usecase";
import { BcryptComparerService } from "./domain/services/bcrypt-comparer.service";
import { BcryptGeneratorService } from "./domain/services/bcrypt-generator.service";
import { BcryptHasherService } from "./domain/services/bcrypt-hasher.service";
import { SERVICE_CONSTANTS } from "./domain/services/constant";
import { REPOSITORY_CONSTANTS } from "./infrastructure/database/constant";
import { PrismaSessionRepository } from "./infrastructure/database/prisma-session.repository";
import { RedisSessionCacheRepository } from "./infrastructure/database/redis-session-cache.repository";
import { LoginController } from "./infrastructure/http/controllers/login.controller";
import { RegisterController } from "./infrastructure/http/controllers/register.controller";

export const authModule: ModuleDefinition = {
  providers: [
    {
      token: TOKENS.PRISMA_CLIENT,
      useValue: getPrismaClient(),
    },
    {
      token: TOKENS.REDIS_CLIENT,
      useValue: RedisClient,
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
        SERVICE_CONSTANTS.BCRYPT_HASHER_SERVICE,
        SERVICE_CONSTANTS.BCRYPT_COMPARER_SERVICE,
        SERVICE_CONSTANTS.BCRYPT_GENERATOR_SERVICE,
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
      ) => new RegisterUseCase(bcryptHasherService, prismaUserRepository),
      inject: [
        SERVICE_CONSTANTS.BCRYPT_HASHER_SERVICE,
        REPOSITORY_CONSTANTS.PRISMA_USER_REPOSITORY,
      ],
    },
  ],

  controllers: [RegisterController, LoginController],
};
