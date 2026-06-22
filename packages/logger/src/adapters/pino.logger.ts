import { Logger } from "../logger";
import type { LoggerOptions } from "../types/logger-options";

/**
 * Adapter Pino nomeado — subclasse de `Logger` que usa `PinoDriver` internamente.
 *
 * Use quando o código consumidor precisa referenciar explicitamente a implementação
 * Pino por nome (ex: injeção de dependências tipada). Para o caso geral, prefira
 * `LoggerFactory.create()` ou instanciar `Logger` diretamente.
 */
export class PinoLogger extends Logger {
  constructor(options: LoggerOptions) {
    super(options);
  }
}
