import { z } from "zod";

export const parseEnvArray = (value: string): string[] => {
  return value.split(",").map((item) => item.trim());
};

export const nodeEnvSchema = z
  .enum(["development", "production", "test"])
  .default("development");

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]).default("info");
