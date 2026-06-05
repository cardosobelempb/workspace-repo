// modules/auths/auth.module.ts

import { RedisClient } from "@repo/cache";
import { ModuleDefinition, TOKENS } from "@repo/common";
import { getPrismaClient } from "@repo/database";
import { AuthLoginServiceClient } from "./domain/services/auth-login.service";
import { SERVICE_BACKEND_CONSTANTS } from "./domain/services/constant";
import { AuthLoginController } from "./infrastructure/http/controllers/auth-login.controller";

export const identityModule: ModuleDefinition = {
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
      token: SERVICE_BACKEND_CONSTANTS.AUTH_LOGIN_SERVICE_CLIENT,
      useClass: AuthLoginServiceClient,
    },
  ],

  controllers: [AuthLoginController],
};
