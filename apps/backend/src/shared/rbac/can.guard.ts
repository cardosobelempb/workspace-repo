import { FastifyReply, FastifyRequest } from "fastify";

import { MembershipRepository } from "@/modules/identity/domain/repositories/membership.repository";
import { Permission, UUIDVO } from "@repo/common";
import { RbacContextCacheRepository } from "./rbac-context-cache.repository";
import { createPermissionSet, resolvePermissionsByRole } from "./resolve-permissions";

/**
 * Factory de autorização por permissão.
 *
 * Fluxo:
 * 1. Valida usuário autenticado.
 * 2. Lê tenant/organization do contexto.
 * 3. Tenta carregar RBAC do Redis.
 * 4. Em cache miss, busca membership no banco.
 * 5. Salva contexto RBAC no Redis.
 * 6. Valida permissão.
 */
export function can(
  requiredPermission: Permission,
  dependencies: {
    membershipRepository: MembershipRepository;
    rbacCache: RbacContextCacheRepository;
  },
) {
  return async function rbacGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        message: "Usuário não autenticado.",
      });
    }

    const tenantId = request.headers["x-tenant-id"] as string | undefined;
    const organizationId = request.headers["x-organization-id"] as string | undefined;

    if (!tenantId) {
      return reply.status(400).send({
        message: "Header x-tenant-id é obrigatório.",
      });
    }

    const cachedContext = await dependencies.rbacCache.get({
      userId: user.id,
      tenantId,
      organizationId,
    });

    if (cachedContext) {
      const permissionSet = createPermissionSet(cachedContext.permissions);

      if (!permissionSet.has(requiredPermission)) {
        return reply.status(403).send({
          message: "Usuário não possui permissão para esta ação.",
        });
      }

      request.auth = {
        user,
        tenantId,
        organizationId,
        role: cachedContext.role,
        permissions: cachedContext.permissions,
      };

      return;
    }

    const membership = await dependencies.membershipRepository.findActive({
      userId: UUIDVO.create(user.id),
      tenantId: UUIDVO.create(tenantId),
      organizationId: UUIDVO.create(organizationId),
    });

    if (!membership) {
      return reply.status(403).send({
        message: "Usuário não pertence a este tenant ou organização.",
      });
    }

    const permissions = resolvePermissionsByRole(membership.role);
    const permissionSet = createPermissionSet(permissions);

    if (!permissionSet.has(requiredPermission)) {
      return reply.status(403).send({
        message: "Usuário não possui permissão para esta ação.",
      });
    }

    await dependencies.rbacCache.set({
      userId: user.id,
      tenantId,
      organizationId,
      role: membership.role,
      permissions,
    });

    request.auth = {
      user,
      tenantId,
      organizationId,
      role: membership.role,
      permissions,
    };
  };
}
