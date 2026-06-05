import type { AuthenticatedUser } from "@/shared/auth/auth.guard";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
    };
    user: AuthenticatedUser;
  }
}
