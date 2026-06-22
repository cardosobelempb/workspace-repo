/**
 * Contexto estruturado que acompanha cada linha de log.
 * Usamos `Record<string, unknown>` em vez de `any` para forçar
 * o consumidor a tratar os valores antes de usá-los (segurança de tipos).
 */
export type LogContext = Record<string, unknown>;
