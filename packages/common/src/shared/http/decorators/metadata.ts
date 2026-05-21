// src/shared/http/decorators/metadata.ts

import { RouteDefinition } from "./types/types.js";

const controllerPrefixMetadata = new WeakMap<object, string>();
const routesMetadata = new WeakMap<object, RouteDefinition[]>();

export function setControllerPrefix(target: object, prefix: string): void {
  controllerPrefixMetadata.set(target, prefix);
}

export function getControllerPrefix(target: object): string {
  return controllerPrefixMetadata.get(target) ?? "";
}

export function addRoute(target: object, route: RouteDefinition): void {
  const routes = routesMetadata.get(target) ?? [];

  routes.push(route);

  routesMetadata.set(target, routes);
}

export function getRoutes(target: object): RouteDefinition[] {
  return routesMetadata.get(target) ?? [];
}

export function updateRoute(
  target: object,
  handlerName: string,
  update: Partial<RouteDefinition>,
): void {
  const routes = getRoutes(target);

  const route = routes.find((item) => item.handlerName === handlerName);

  if (!route) {
    throw new Error(`Decorator usado antes de registrar a rota: ${handlerName}`);
  }

  Object.assign(route, update);
}
