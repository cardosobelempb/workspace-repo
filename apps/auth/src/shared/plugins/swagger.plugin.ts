// shared/http/swagger.plugin.ts

import swagger from "@fastify/swagger";
import scalarReference from "@scalar/fastify-api-reference";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

import { envAuth } from "@/config/env-auth.js";

export type BuildAppOptions = {
  swagger?: {
    title: string;
    version: string;
    description?: string;
  };
};

export async function swaggerPlugin(
  app: FastifyInstance,
  options: BuildAppOptions = {},
): Promise<void> {
  // ── 1. Gera o spec OpenAPI ─────────────────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: options.swagger?.title ?? envAuth.TITLE,
        version: options.swagger?.version ?? envAuth.VERSION,
        description: options.swagger?.description ?? envAuth.DESCRIPTION,
      },
      servers: [
        {
          url: `http://${envAuth.PUBLIC_HOST}:${envAuth.PORT}`,
          description: "Servidor de desenvolvimento",
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: envAuth.SESSION_COOKIE_NAME,
          },
        },
      },
    },
    // @fastify/swagger lê schema.body para gerar requestBody no spec OpenAPI.
    // O register-routes.ts armazena o JSON Schema em schema.requestBody (para
    // não disparar o validatorCompiler). Aqui copiamos para schema.body no
    // resultado do transform, que é lido apenas para geração da documentação.
    transform: (input) => {
      const result = jsonSchemaTransform(input);

      const rb = (result.schema as Record<string, unknown>).requestBody as
        | { content?: { "application/json"?: { schema?: unknown } } }
        | undefined;

      const bodySchema = rb?.content?.["application/json"]?.schema;
      if (bodySchema) {
        (result.schema as Record<string, unknown>).body = bodySchema;
      }

      return result;
    },
  });

  // ── 2. Serve a UI via Scalar ───────────────────────────────────────────────
  //
  // @scalar/fastify-api-reference v1.55+ mudou a API:
  //   - `configuration.spec` foi REMOVIDO
  //   - A URL do spec vai em `configuration.url` (nível raiz da configuration)
  //   - Quando @fastify/swagger está registrado, o Scalar o detecta automaticamente
  //     e não precisa de `url` — basta não informar nada em `configuration.url`
  //
  // Import dinâmico obrigatório: pacote é ESM puro, projeto é CJS.

  await app.register(scalarReference, {
    routePrefix: "/docs",

    // ⚠️  Não passe `configuration.spec` — não existe mais na v1.55+
    // O Scalar detecta o @fastify/swagger automaticamente via hook interno.
    configuration: {
      theme: "deepSpace",
    },
  });
}

export default fp(swaggerPlugin);
