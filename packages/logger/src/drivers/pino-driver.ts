import pino, { type Logger as PinoInstance } from "pino";
import type { LogContext, LoggerDriver, LoggerOptions, LogLevel } from "../types";

/**
 * Driver baseado em Pino.
 *
 * Por que Pino e não Winston ou console.log?
 * - Pino é o logger mais rápido do ecossistema Node (serialização assíncrona, baixo overhead).
 * - Gera JSON estruturado nativamente — essencial para agregadores de log (Datadog, ELK, Loki).
 * - Suporta "child loggers" com custo praticamente zero (apenas merge de objetos).
 *
 * Esta classe ADAPTA a API do Pino para a interface `LoggerDriver` que definimos.
 * Isso é o padrão Adapter (GoF): se um dia quisermos trocar Pino por outra lib,
 * só reescrevemos este arquivo — o resto do sistema não muda (Open/Closed Principle).
 */
export class PinoDriver implements LoggerDriver {
  private readonly instance: PinoInstance;

  /**
   * Construtor com duas formas de uso:
   * - `new PinoDriver(options)` — caminho normal, cria uma instância pino do zero.
   * - `new PinoDriver(existingInstance)` — caminho interno, usado por `.child()`
   *   para envolver uma instância pino já derivada (`pino().child(...)`),
   *   sem precisar reconfigurar transporte/redact novamente.
   *
   * Por que não usar `Object.create(PinoDriver.prototype)` + cast para injetar
   * a instância depois? Porque `instance` é `private`: TypeScript usa tipagem
   * nominal para campos privados, então um objeto literal `{ instance: ... }`
   * NUNCA é estruturalmente compatível com `PinoDriver`, mesmo via `as` — o
   * compilador corretamente recusa o cast ("conversion may be a mistake").
   * Uma sobrecarga de construtor resolve isso sem nenhum cast.
   */
  constructor(optionsOrInstance: LoggerOptions | PinoInstance) {
    if (isPinoInstance(optionsOrInstance)) {
      this.instance = optionsOrInstance;
      return;
    }

    const options = optionsOrInstance;
    const isProduction = options.environment === "production";
    const usePretty = options.pretty ?? !isProduction;

    this.instance = pino({
      level: options.level ?? "info",
      base: { service: options.serviceName },
      // Redação automática de campos sensíveis — proteção LGPD/GDPR "by design".
      redact: options.redact
        ? { paths: options.redact, censor: "[REDACTED]" }
        : undefined,
      // Em produção, usamos timestamp ISO (legível e padronizado).
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: usePretty
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss.l",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    });
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.instance[level](context ?? {}, message);
  }

  child(bindings: LogContext): LoggerDriver {
    return new PinoDriver(this.instance.child(bindings));
  }

  async flush(): Promise<void> {
    // Pino é assíncrono por padrão; flush garante que nada fique no buffer
    // ao encerrar um processo serverless (Vercel, Lambda) ou um worker.
    return new Promise((resolve) => {
      this.instance.flush(() => resolve());
    });
  }
}

/** Type guard simples: distingue uma instância pino real de um objeto `LoggerOptions`. */
function isPinoInstance(value: LoggerOptions | PinoInstance): value is PinoInstance {
  return typeof (value as PinoInstance).child === "function";
}
