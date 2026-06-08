import type { FastifyReply } from "fastify";

import "./plugin-fastify-cookie";

export function clearSessionCookie(
  reply: FastifyReply,
  cookieName: string = "sid",
): void {
  reply.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
