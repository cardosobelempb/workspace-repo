import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifiedEmailGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = (request as any).user;

  if (!user?.emailVerified) {
    reply.status(403).send({ error: "Forbidden", code: "EMAIL_NOT_VERIFIED" });
  }
}
