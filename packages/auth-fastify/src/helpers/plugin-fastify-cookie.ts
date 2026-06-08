import fastifyCookie from "@fastify/cookie";
import fp from "fastify-plugin";

import type { FastifyInstance } from "fastify";
import { envAuthFastify } from "../config/env-auth-fastify";

export async function authCookiePlugin(app: FastifyInstance) {
  await app.register(fastifyCookie, {
    secret: envAuthFastify.COOKIE_SECRET,
  });
}

export default fp(authCookiePlugin);
