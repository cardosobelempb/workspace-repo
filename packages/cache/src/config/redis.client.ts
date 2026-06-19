import { LoggerFactory } from "@repo/common";
import Redis from "ioredis";
import { envRedis } from "./env-redis";

// ============================================================
// Singleton Redis com configuração profissional
// ============================================================

const logger = LoggerFactory.create("RedisClient");

declare global {
  var redis: Redis | undefined;
}

/**
 * Cria e configura uma instância singleton do Redis Client
 * com tratamento adequado de eventos e logging
 */
const createRedisClient = () => {
  // Validação das variáveis de ambiente obrigatórias
  const requiredEnvVars = ["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !envRedis[varName as keyof typeof envRedis],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(", ")}`,
    );
  }

  const client = new Redis(
    // Prioriza REDIS_URL se disponível, senão usa host/port
    envRedis.REDIS_URL || `redis://${envRedis.REDIS_HOST}:${envRedis.REDIS_PORT}`,
    {
      // Configurações de conexão
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      // Configurações de reconexão
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          logger.warn("Redis READONLY error, reconnecting...", {
            error: err.message,
          });
          return true; // Tentar reconectar
        }
        return false; // Não reconectar para outros erros
      },
    },
  );

  // Tratamento de eventos de conexão
  client.on("connect", () => {
    logger.info("Redis client conectado");
  });

  client.on("ready", () => {
    logger.info("Redis client pronto para uso");
  });

  client.on("error", (error) => {
    logger.error("Erro na conexão Redis", {
      error: error.message,
      code: error instanceof Error ? error.message : String(error),
    });
  });

  client.on("close", () => {
    logger.warn("Conexão Redis fechada");
  });

  client.on("reconnecting", () => {
    logger.info("Tentando reconectar ao Redis...");
  });

  client.on("end", () => {
    logger.info("Conexão Redis encerrada");
  });

  // Handler para mensagens de aviso do Redis
  client.on("warning", (warning) => {
    logger.warn("Aviso do Redis", { warning });
  });

  return client;
};

// Singleton pattern com verificação de ambiente
export const RedisClient =
  process.env.NODE_ENV !== "test" && global.redis
    ? (global.redis as Redis)
    : createRedisClient();

// Em desenvolvimento, mantém referência global para inspeção
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  global.redis = RedisClient;
}

// Exporta função para reconexão manual (útil em testes)
export const reconnectRedis = async () => {
  if (RedisClient.status !== "ready") {
    logger.info("Iniciando reconexão manual do Redis");
    await RedisClient.connect();
  }
};

// Exporta health check para monitoramento
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (RedisClient.status !== "ready") {
      return false;
    }
    const result = await RedisClient.ping();
    return result === "PONG";
  } catch (error) {
    logger.error("Falha no health check do Redis", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
