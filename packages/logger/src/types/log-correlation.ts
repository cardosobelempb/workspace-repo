/**
 * Metadados de correlação — essenciais em monorepos com múltiplos serviços.
 * Permitem rastrear uma requisição do Fastify até uma query do Prisma,
 * passando pelo NestJS, usando o mesmo `requestId`/`traceId`.
 */
export interface LogCorrelation {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  tenantId?: string;
}
