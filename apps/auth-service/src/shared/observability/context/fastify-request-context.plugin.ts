import { RequestContextData } from "@repo/logger";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    requestContext: RequestContextData;
  }
}

export const fastifyRequestContextPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest("requestContext", {
    getter() {
      return this.requestContext;
    },
    setter(value: RequestContextData) {
      this.requestContext = value;
    },
  });

  app.addHook("onRequest", async (request) => {
    const requestId = request.headers["x-request-id"]?.toString() ?? randomUUID();

    const traceId = request.headers["x-trace-id"]?.toString() ?? requestId;

    request.requestContext = {
      requestId,
      traceId,
    };
  });
});
