export enum Permission {
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  TENANT_READ = "tenant:read",
  TENANT_UPDATE = "tenant:update",

  ORGANIZATION_CREATE = "organization:create",
  ORGANIZATION_READ = "organization:read",
  ORGANIZATION_UPDATE = "organization:update",
  ORGANIZATION_DELETE = "organization:delete",

  MEMBERSHIP_INVITE = "membership:invite",
  MEMBERSHIP_READ = "membership:read",
  MEMBERSHIP_UPDATE = "membership:update",
  MEMBERSHIP_REMOVE = "membership:remove",

  PAYMENT_READ = "payment:read",
  PAYMENT_CREATE = "payment:create",
  PAYMENT_REFUND = "payment:refund",

  PLAN_READ = "plan:read",
  PLAN_CREATE = "plan:create",
  PLAN_UPDATE = "plan:update",
  PLAN_DELETE = "plan:delete",

  HOTSPOT_READ = "hotspot:read",
  HOTSPOT_MANAGE = "hotspot:manage",

  VOUCHER_CREATE = "voucher:create",
  VOUCHER_READ = "voucher:read",
  VOUCHER_REVOKE = "voucher:revoke",

  REPORT_READ = "report:read",
  SETTINGS_UPDATE = "settings:update",
}
