import { LoggerFactory } from "@repo/logger";
import { buildApp } from "./app.js";
import { envBackend } from "./config/env-backend.js";

const PORT = envBackend.PORT;
const HOST = envBackend.HOST;
const NODE_ENV = envBackend.NODE_ENV;

const isProduction = NODE_ENV === "production";

const PUBLIC_HOST = isProduction ? HOST : (envBackend.PUBLIC_HOST ?? "localhost");

const baseUrl = `http://${PUBLIC_HOST}:${PORT}`;

const logger = LoggerFactory.create("bootstrap");

function logServerStarted(): void {
  logger.info("Server started successfully", {
    event: "SERVER_STARTED",
    environment: NODE_ENV,
    host: HOST,
    publicHost: PUBLIC_HOST,
    port: PORT,
  });

  if (!isProduction) {
    logger.info("Server URL available", {
      event: "SERVER_URL_AVAILABLE",
      url: baseUrl,
    });

    logger.info("Swagger documentation available", {
      event: "SWAGGER_AVAILABLE",
      url: `${baseUrl}/docs`,
    });
  }
}

function logServerError(error: unknown): void {
  logger.error("Failed to start server", error, {
    event: "SERVER_START_ERROR",
  });
}

export async function startServer(): Promise<void> {
  const app = await buildApp({
    cors: {
      origin: isProduction ? envBackend.CORS_ORIGINS : ["http://localhost:3000"],
      credentials: true,
    },

    swagger: {
      title: "Hotspot API",
      version: "1.0.0",
      description: "API do sistema de hotspot",
    },
  });

  try {
    await app.listen({
      port: PORT,
      host: HOST,
    });

    logServerStarted();
  } catch (error) {
    logServerError(error);
    process.exit(1);
  }
}
