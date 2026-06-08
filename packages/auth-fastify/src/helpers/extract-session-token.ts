import type { FastifyRequest } from "fastify";

import "./plugin-fastify-cookie";

export function extractSessionToken(
  request: FastifyRequest,
  cookieName: string = "sid",
): string | null {
  const fromCookie = (request.cookies as Record<string, string>)?.[cookieName];
  if (fromCookie) return fromCookie;

  const auth = request.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return null;
}
