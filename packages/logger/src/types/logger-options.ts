import { LogLevel } from "./log-level";
import { LoggerDriver } from "./logger-driver";

/** Opções de configuração do logger — usadas na fábrica `createLogger`. */
export interface LoggerOptions {
  /** Nome do serviço/aplicação. Aparece em todo log para facilitar filtragem em ferramentas como Datadog/Grafana Loki. */
  serviceName: string;
  /** Ambiente de execução. Controla formatação (pretty em dev, JSON em prod). */
  environment?: "development" | "production" | "test" | "staging";
  /** Nível mínimo de log a ser emitido. Logs abaixo desse nível são descartados (custo zero). */
  level?: LogLevel;
  /** Redação de campos sensíveis (LGPD/GDPR) — ex: ['password', 'token', '*.creditCard']. */
  redact?: string[];
  /** Permite injetar um driver customizado (ex: para testes, usar um mock). */
  driver?: LoggerDriver;
  /** Habilita saída "pretty" (colorida, legível) independente do ambiente. Útil em CI local. */
  pretty?: boolean;
}
