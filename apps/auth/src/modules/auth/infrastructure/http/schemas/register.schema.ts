import {
  CreateUserProfileBodySchema,
  CreateUserProfileSchema,
  UserProfileProjectionSchema,
} from "@/modules/user/infrastructure/http/schemas/user-profile.schema";
import { UserProjectionSchema } from "@/modules/user/infrastructure/http/schemas/user.schema";
import { s } from "@repo/common";
import { z } from "zod";

/**
 * Schema de entrada do login.
 *
 * Por que usar Zod?
 * - Valida entrada antes do controller executar.
 * - Gera tipos inferidos.
 * - Evita dados inválidos chegando no use case.
 */
export const RegisterSchema = z.object({
  email: s.email,
  password: s.password,
  profile: CreateUserProfileSchema,
});

export const RegisterBodySchema = z.object({
  email: s.email,
  password: s.password,
  profile: CreateUserProfileBodySchema,
});

// Payload de criação: sem campos gerados pelo servidor
export const RegisterProjectionSchema = z.object({
  user: UserProjectionSchema,
  profile: UserProfileProjectionSchema,
});
