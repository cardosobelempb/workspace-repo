import { s } from "@/common/shared";
import { z } from "zod";

/**
 * Schema de entrada do login.
 *
 * Por que usar Zod?
 * - Valida entrada antes do controller executar.
 * - Gera tipos inferidos.
 * - Evita dados inválidos chegando no use case.
 */
export const LoginSchema = z.object({
  email: s.email,
  password: s.password,
});
