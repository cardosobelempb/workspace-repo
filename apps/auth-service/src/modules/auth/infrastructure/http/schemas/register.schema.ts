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
  firstName: s.name,
  lastName: s.name,
});
