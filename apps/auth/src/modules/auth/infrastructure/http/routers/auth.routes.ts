// modules/auths/infra/routes/auth.routes.ts

import { authModule } from "@/modules/auth/auth.module";
import { registerModule } from "@/modules/register-module";
import type { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ✅ prefix aqui — envolve tudo que o registerModule registrar
  await app.register(
    async (router) => {
      await registerModule(router, authModule);
    },
    { prefix: "api/v1" },
  );
}
