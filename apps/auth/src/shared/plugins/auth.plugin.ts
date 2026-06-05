// src/shared/auth/auth.plugin.ts

import { envAuth } from "@/config/env-auth.js";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export async function authPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: envAuth.JWT_ACCESS_TOKEN_SECRET,
  });
}

export default fp(authPlugin);
