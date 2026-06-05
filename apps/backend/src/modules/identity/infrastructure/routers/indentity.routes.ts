// modules/auths/infra/routes/auth.routes.ts

import { registerModule } from "@/modules/register-module";
import type { FastifyInstance } from "fastify";
import { identityModule } from "../../identity.module";

export async function identityRoutes(app: FastifyInstance): Promise<void> {
  // ✅ prefix aqui — envolve tudo que o registerModule registrar
  await app.register(
    async (router) => {
      await registerModule(router, identityModule);
    },
    { prefix: "api/v1" },
  );
}
