// src/shared/auth/auth.plugin.ts

import { envBackend } from "@/config/env-backend.js";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export async function authPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: envBackend.JWT_ACCESS_TOKEN_SECRET,
  });
}

export default fp(authPlugin);
