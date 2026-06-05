import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authRoutes } from "./modules/auth/infrastructure/http/routers/auth.routes";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Home / Hello World
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      summary: "Retorna uma mensagem de saudação",
      description: "Hello World route",
      tags: ["Hello World"],
      response: { 200: z.object({ message: z.string() }) },
    },
    handler: () => ({ message: "Hello World" }),
  });

  await authRoutes(app);
  // await userRoutes(app);

  // API routes
  // await app.register(categoryRoutes, { prefix: "/api/v1/categories" });
  // await app.register(accountRoutes, { prefix: "/api/accounts" });
  // await app.register(authRoutes, { prefix: "/api/auth" });
  // await app.register(userRoutes, { prefix: "/api/v1/users" });
  // await app.register(mikrotikRoutes, { prefix: "/api/mikrotiks" });
  // await app.register(oerganizationRoutes, { prefix: "/api/organizations" });
}
