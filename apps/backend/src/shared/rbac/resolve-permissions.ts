import { MembershipRole, Permission } from "@repo/common";
import { rolePermissions } from "./role-permissions";

/**
 * Resolve permissões de uma role.
 *
 * Mantém o mapa centralizado e evita lógica espalhada pelos guards.
 */
export function resolvePermissionsByRole(role: MembershipRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Cria um Set para verificação performática de permissões.
 */
export function createPermissionSet(permissions: Permission[]): Set<Permission> {
  return new Set(permissions);
}
