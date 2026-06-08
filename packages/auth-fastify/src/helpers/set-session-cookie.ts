import type { FastifyReply } from "fastify";

import "./plugin-fastify-cookie";

export type SetSessionCookieOptions = {
  token: string;
  expiresAt: Date;
  cookieName?: string;
  secure?: boolean;
  domain?: string;
};

export function setSessionCookie(
  reply: FastifyReply,
  options: SetSessionCookieOptions,
): void {
  reply.setCookie(options.cookieName ?? "sid", options.token, {
    httpOnly: true,
    secure: options.secure ?? process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: options.expiresAt,
    domain: options.domain,
  });
}
