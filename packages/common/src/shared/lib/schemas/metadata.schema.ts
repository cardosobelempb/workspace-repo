import z from "zod";
/** Metadata genérica: chaves string, valores primitivos */
export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);
