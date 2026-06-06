import { z } from "zod";

export const whatsappConfigSchema = z.object({
  accessToken: z.string().min(1),
  phoneNumberId: z.string().min(1),
  apiVersion: z.string().default("v20.0"),
});

export type WhatsAppConfig = z.infer<typeof whatsappConfigSchema>;
