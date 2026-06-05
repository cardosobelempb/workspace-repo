import z from "zod";
/** Metadata genérica: chaves string, valores primitivos */
export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const MetadataStringSchema = z.record(z.string(), z.string());
export const MetadataNumberSchema = z.record(z.coerce.number(), z.coerce.number());
/** Record<string, unknown> */
export const MetadataUnknownSchema = z.record(z.string(), z.unknown());

/** Record<string, string> */
export const stringRecord = z.record(z.string(), z.string());
