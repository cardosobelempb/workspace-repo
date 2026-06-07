// packages/auth-fastify/src/schemas/auth.schema.ts

import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(72),
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
});

export const LoginWithPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8).max(72),
});

export const EmptyBodySchema = z.object({}).optional();

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginWithPasswordDto = z.infer<typeof LoginWithPasswordSchema>;
export type EmptyBodyDto = z.infer<typeof EmptyBodySchema>;
