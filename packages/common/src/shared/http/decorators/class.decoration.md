/**
 * Decorator de classe para marcar uma classe como um controlador.
 * @param path O caminho associado ao controlador, usado para fins de roteamento e organização.
 * @returns Uma função decoradora que marca a classe como um controlador e loga o caminho associado a ele.
 */
export function Controller(path: string) {
  return function <T extends { new (...args: unknown[]): object }>(constructor: T): void {
    console.log(`Controller criado: ${path} -> Classe: ${constructor.name}`);
  };
}

/**
 * Exemplo de uso do decorador Controller:
 *
 * @Controller("/users")
 * class UserController {}
 *
 * // Saída no console:
 * // Controller criado: /users
 */
