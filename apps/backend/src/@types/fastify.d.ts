import "fastify";
import { Permission } from "../shared/rbac/permissions";
import { Role } from "../shared/rbac/roles";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      user: {
        id: string;
        email: string;
      };
      tenantId: string;
      organizationId?: string;
      role: Role;
      permissions: Permission[];
    };
  }
}
