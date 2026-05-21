import { setControllerPrefix } from "./metadata";

/**
 * Define o prefixo base de um controller.
 *
 * Exemplo:
 * @Controller("/users")
 */
export function Controller(prefix: string = "") {
  return function (target: object): void {
    setControllerPrefix(target, prefix);
  };
}
