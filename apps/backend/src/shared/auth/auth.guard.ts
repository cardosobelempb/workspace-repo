import { FastifyReply, FastifyRequest } from "fastify";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

/**
 * Guard de autenticação.
 *
 * Responsabilidade:
 * - Verificar se existe token Bearer.
 * - Validar JWT.
 * - Popular request.user com dados mínimos do usuário.
 *
 * Importante:
 * - Este guard NÃO valida permissão.
 * - Permissão é responsabilidade do RBAC guard.
 */
export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return reply.status(401).send({
      message: "Token de autenticação não informado.",
    });
  }

  const [, token] = authorization.split(" ");

  if (!token) {
    return reply.status(401).send({
      message: "Token de autenticação inválido.",
    });
  }

  try {
    const payload = await request.jwtVerify<{
      sub: string;
      email: string;
    }>();

    request.user = {
      id: payload.sub,
      email: payload.email,
    } as AuthenticatedUser;
  } catch {
    return reply.status(401).send({
      message: "Token expirado ou inválido.",
    });
  }
}
