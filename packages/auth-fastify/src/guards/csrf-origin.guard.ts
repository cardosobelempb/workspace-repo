import type { FastifyReply, FastifyRequest } from "fastify";

export function createCsrfOriginGuard(allowedOrigins: string[]) {
  return async function csrfOriginGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const origin = request.headers.origin ?? "";

    if (!allowedOrigins.includes(origin)) {
      reply.status(403).send({ error: "Forbidden", code: "INVALID_ORIGIN" });
    }
  };
}
