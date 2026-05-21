/**
 * ⚠️ IMPORTANTE
 * Este import DEVE ser o primeiro do projeto inteiro.
 * TypeORM, decorators e metadata dependem disso.
 */

import "dotenv/config";

import { LoggerFactory } from "@repo/common";
import { startServer } from "./server.js";

/**
 * Entry point da aplicação.
 * Responsável por inicializar dependências críticas
 * e iniciar o servidor apenas quando tudo estiver pronto.
 */
async function bootstrap(): Promise<void> {
  const logger = LoggerFactory.create("bootstrap");
  try {
    // Inicializa conexão com o banco
    logger.info("Data source initialized successfully", {
      event: "DB_INIT",
      context: "bootstrap",
    });

    // Inicia servidor HTTP
    await startServer();
  } catch (error) {
    logger.error("Error while initializing application", error, {
      event: "APP_INIT_ERROR",
      context: "bootstrap",
    });

    // Fail fast: encerra o processo com erro
    process.exit(1);
  }
}

bootstrap();
