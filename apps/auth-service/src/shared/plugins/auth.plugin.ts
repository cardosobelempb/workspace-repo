// src/shared/auth/auth.plugin.ts

import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "@/config/env.js";

export async function authPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_TOKEN_SECRET,
  });
}

export default fp(authPlugin);
