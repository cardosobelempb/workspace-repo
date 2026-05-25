import { Permission, Role } from "@repo/common";

/**
 * Mapa central de permissões por perfil.
 *
 * Por que usar este arquivo?
 * - Evita espalhar regras de permissão pelos controllers.
 * - Facilita manutenção.
 * - Permite revisar segurança em um único lugar.
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.TENANT_READ,
    Permission.ORGANIZATION_CREATE,
    Permission.ORGANIZATION_READ,
    Permission.ORGANIZATION_UPDATE,
    Permission.MEMBERSHIP_INVITE,
    Permission.MEMBERSHIP_READ,
    Permission.MEMBERSHIP_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PLAN_READ,
    Permission.PLAN_CREATE,
    Permission.PLAN_UPDATE,
    Permission.HOTSPOT_READ,
    Permission.HOTSPOT_MANAGE,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_READ,
    Permission.REPORT_READ,
    Permission.SETTINGS_UPDATE,
  ],

  [Role.MANAGER]: [
    Permission.USER_READ,
    Permission.ORGANIZATION_READ,
    Permission.MEMBERSHIP_READ,
    Permission.PAYMENT_READ,
    Permission.PLAN_READ,
    Permission.HOTSPOT_READ,
    Permission.VOUCHER_READ,
    Permission.REPORT_READ,
  ],

  [Role.FINANCE]: [
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_REFUND,
    Permission.PLAN_READ,
    Permission.REPORT_READ,
  ],

  [Role.SUPPORT]: [
    Permission.USER_READ,
    Permission.MEMBERSHIP_READ,
    Permission.HOTSPOT_READ,
    Permission.VOUCHER_READ,
  ],

  [Role.OPERATOR]: [
    Permission.HOTSPOT_READ,
    Permission.HOTSPOT_MANAGE,
    Permission.VOUCHER_CREATE,
    Permission.VOUCHER_READ,
  ],

  [Role.AFFILIATE]: [Permission.REPORT_READ],

  [Role.MEMBER]: [Permission.ORGANIZATION_READ],

  [Role.CUSTOMER]: [],
};
