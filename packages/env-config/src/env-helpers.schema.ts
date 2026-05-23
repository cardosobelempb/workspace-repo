import { z } from "zod";

// ── Common schema helpers ───────────────────────────────────────────────────

// ✅ Helper para transformar strings separadas por vírgula em arrays
export const parseEnvArray = (value: string): string[] => {
  return value.split(",").map((item) => item.trim());
};

// ── Environment variable schemas ─────────────────────────────────────────────
// ✅ Schemas específicos para variáveis de ambiente, com validação e valores padrão
export const nodeEnvSchema = z
  .enum(["development", "production", "test"])
  .default("development");

// ✅ Log level with default value

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]).default("info");
