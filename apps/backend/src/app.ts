import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

import { BadRequestError, LoggerFactory } from "@repo/common";
import { getPrismaClient, PrismaLoggerAdapter } from "@repo/database";

import { envBackend } from "./config/env-backend.js";
import { errorHandler } from "./middlewares/error-handler";
import { registerRoutes } from "./routes";
import { authPlugin } from "./shared/plugins/auth.plugin";
import { swaggerPlugin } from "./shared/plugins/swagger.plugin";

// ============================================================
// Tipos
// ============================================================

export type BuildAppOptions = {
  logger?: boolean;
  cors?: {
    origin: string[] | string;
    credentials: boolean;
  };
  swagger?: {
    title: string;
    version: string;
    description?: string;
  };
};

// ============================================================
// Factory
// ============================================================

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const logger = LoggerFactory.create("application");
  const requestLogger = LoggerFactory.create("request");
  const prismaLogger = LoggerFactory.create("prisma");

  // ========================================================
  // Fastify
  // ========================================================

  const app = Fastify({
    disableRequestLogging: true,

    schemaErrorFormatter(errors, dataVar) {
      const validationError = new BadRequestError({
        fieldName: dataVar,
        message: `${dataVar} validation failed`,
      });

      Object.assign(validationError, {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        error: "Validation Error",
        validation: errors,
      });

      return validationError;
    },

    logger: options.logger !== false,
  });

  // ========================================================
  // Prisma + Logger Adapter
  // ========================================================

  const prisma = getPrismaClient();

  new PrismaLoggerAdapter(prisma, prismaLogger).register();

  // ========================================================
  // Compiladores Zod
  // ========================================================

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ========================================================
  // Error handler global
  // ========================================================

  app.setErrorHandler(errorHandler);

  // ========================================================
  // Plugins
  // ========================================================

  await app.register(fastifyCors, {
    origin: options.cors?.origin ?? envBackend.CORS_ORIGINS,
    credentials: options.cors?.credentials ?? true,
  });

  const cookieSecret = envBackend.COOKIE_SECRET;

  if (!cookieSecret) {
    logger.error("Missing required environment variable: COOKIE_SECRET", undefined, {
      event: "MISSING_ENV",
      variable: "COOKIE_SECRET",
    });

    throw new Error("Missing required environment variable: COOKIE_SECRET");
  }

  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  await app.register(swaggerPlugin, options);
  await app.register(authPlugin);

  // ========================================================
  // Decorators
  // ========================================================

  app.decorate("logger", logger);
  app.decorate("prisma", prisma);

  // ========================================================
  // Hooks de request
  // ========================================================

  app.addHook("onRequest", async (request) => {
    requestLogger.info("Incoming request", {
      event: "REQUEST_START",
      method: request.method,
      url: request.url,
      requestId: request.id,
    });
  });

  app.addHook("onResponse", async (request, reply) => {
    requestLogger.info("Request completed", {
      event: "REQUEST_COMPLETED",
      method: request.method,
      url: request.url,
      requestId: request.id,
      statusCode: reply.statusCode,
    });
  });

  app.addHook("onError", async (request, _reply, error) => {
    requestLogger.error("Request failed", error, {
      event: "REQUEST_ERROR",
      method: request.method,
      url: request.url,
      requestId: request.id,
    });
  });

  // ========================================================
  // Hooks da aplicação
  // ========================================================

  app.addHook("onReady", async () => {
    logger.info("Application initialized", {
      event: "APP_READY",
      port: envBackend.PORT,
      env: envBackend.NODE_ENV,
      routes: "initialized",
    });
  });

  app.addHook("onClose", async () => {
    logger.info("Application shutting down", {
      event: "APP_SHUTDOWN",
      context: "bootstrap",
    });

    await prisma.$disconnect();
  });

  // ========================================================
  // Rotas
  // ========================================================

  await registerRoutes(app);

  return app;
}
