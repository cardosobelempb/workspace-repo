import type { ILogger } from "@repo/logger";
import type { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

/**
 * IMPORTANTE: não usamos o nome `log` aqui.
 *
 * O próprio Fastify já declara `FastifyRequest.log: FastifyBaseLogger`
 * (o logger interno dele, baseado em Pino). Se tentarmos fazer module
 * augmentation redeclarando `log` com outro tipo (`ILogger`), o TypeScript
 * recusa o merge de interfaces: "Subsequent property declarations must
 * have the same type" — duas declarações da MESMA propriedade com tipos
 * diferentes não podem coexistir.
 *
 * Por isso usamos `appLog` como nome de propriedade próprio: não colide
 * com nada do Fastify core nem de plugins oficiais (@fastify/*), e deixa
 * explícito, ao ler o código, que esse é "nosso" logger de aplicação —
 * diferente do `request.log` nativo do framework.
 */
declare module "fastify" {
  interface FastifyRequest {
    /** Logger filho já vinculado ao requestId desta requisição específica. */
    appLog: ILogger;
  }
}

export interface FastifyLoggerPluginOptions {
  logger: ILogger;
  /** Nome do header usado para correlacionar requisições entre serviços (ex: API Gateway -> microsserviço). */
  requestIdHeader?: string;
  /** Rotas que não devem gerar log de acesso (ex: health checks, que poluem o log). */
  ignorePaths?: string[];
}

/**
 * Plugin Fastify que:
 * 1. Gera/propaga um `requestId` por requisição.
 * 2. Cria um logger filho (`request.appLog`) já com esse `requestId` embutido.
 * 3. Loga automaticamente entrada e saída de cada requisição (access log).
 *
 * Por que um plugin e não um middleware manual?
 * Fastify usa hooks (`onRequest`, `onResponse`) que respeitam o ciclo de vida
 * assíncrono do framework — diferente do Express, aqui não há risco de o hook
 * rodar fora de ordem em relação a outros plugins (decorators são síncronos).
 */
export const fastifyLoggerPlugin: FastifyPluginCallback<FastifyLoggerPluginOptions> = (
  fastify: FastifyInstance,
  options: FastifyLoggerPluginOptions,
  done: (err?: Error) => void,
) => {
  const { logger, requestIdHeader = "x-request-id", ignorePaths = [] } = options;

  /**
   * Por que `getter`/`setter` em vez de `decorateRequest('appLog', null)`?
   *
   * No Fastify 4+, a assinatura de `decorateRequest` é genérica e infere o
   * TIPO da decoração a partir do valor passado. Como `appLog` foi declarado
   * via module augmentation como `ILogger` (nunca `null`), passar `null` como
   * valor inicial não satisfaz esse tipo — o TypeScript rejeita com
   * "Argument of type 'null' is not assignable to parameter of type
   * GetterSetter<FastifyRequest, ILogger>".
   *
   * Além de resolver o tipo, a forma getter/setter é também a recomendada
   * pela própria documentação do Fastify para decorações cujo valor real só
   * existe por requisição (aqui, só depois do hook `onRequest` abaixo): cada
   * requisição usa um slot próprio no objeto, em vez de compartilhar um valor
   * inicial no prototype que precisaria ser sobrescrito manualmente sempre.
   */
  fastify.decorateRequest("appLog", {
    getter() {
      return undefined as unknown as ILogger;
    },
  });

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const requestId =
      (request.headers[requestIdHeader] as string | undefined) ?? randomUUID();

    // Cada requisição recebe seu PRÓPRIO logger filho — isolamento total,
    // sem risco de "vazar" contexto entre requisições concorrentes
    // (problema comum em loggers globais mutáveis).
    request.appLog = logger.child({
      requestId,
      method: request.method,
      url: request.url,
    });

    if (!ignorePaths.includes(request.url)) {
      request.appLog.info("Requisição recebida");
    }
  });

  fastify.addHook("onResponse", async (request, reply) => {
    if (!ignorePaths.includes(request.url)) {
      request.appLog.info("Requisição finalizada", {
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      });
    }
  });

  fastify.addHook("onError", async (request, _reply, error) => {
    request.appLog.error("Erro não tratado na requisição", error);
  });

  done();
};
