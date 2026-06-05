// shared/module/register-module.ts

import { ControllerInstance, DIContainer, ModuleDefinition } from "@repo/common";
import type { FastifyInstance } from "fastify";
import { registerControllers } from "@/shared/register-routes";

export async function registerModule(
  app: FastifyInstance,
  module: ModuleDefinition,
): Promise<void> {
  const container = new DIContainer();

  container.register(module.providers);

  const controllers: ControllerInstance[] = module.controllers.map((Controller) =>
    container.resolve(Controller),
  );

  await registerControllers(app, controllers);
}
