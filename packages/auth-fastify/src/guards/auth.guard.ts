import type { ResolveSessionUseCase } from "@repo/auth-core";
import type { FastifyReply, FastifyRequest } from "fastify";
import { extractSessionToken } from "../helpers/extract-session-token";

export function createAuthGuard(
  resolveSessionUseCase: ResolveSessionUseCase,
  cookieName: string = "sid",
) {
  return async function authGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = extractSessionToken(request, cookieName);

    if (!token) {
      reply.status(401).send({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }

    const result = await resolveSessionUseCase.execute(token);

    if (result instanceof Error) {
      reply.status(401).send({ error: "Unauthorized", code: result });
      return;
    }

    (request as any).user = result;
  };
}
